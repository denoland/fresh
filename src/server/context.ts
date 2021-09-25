import {
  extname,
  fromFileUrl,
  mediaTypeLookup,
  router,
  toFileUrl,
  walk,
} from "./deps.ts";
import { Routes } from "./mod.ts";
import { Bundler } from "./bundle.ts";
import { INTERNAL_PREFIX } from "./constants.ts";
import { JS_PREFIX } from "./constants.ts";
import { BUILD_ID } from "./constants.ts";
import {
  Handler,
  Page,
  PageModule,
  Renderer,
  RendererModule,
} from "./types.ts";
import { render as internalRender } from "./render.tsx";

export class ServerContext {
  #pages: Page[];
  #staticFiles: [URL, string][];
  #bundler: Bundler;
  #renderer: Renderer;

  constructor(
    pages: Page[],
    staticFiles: [URL, string][],
    renderer: Renderer,
  ) {
    this.#pages = pages;
    this.#staticFiles = staticFiles;
    this.#renderer = renderer;
    this.#bundler = new Bundler(pages);
  }

  /**
   * Process the routes into individual components and pages.
   */
  static async fromRoutes(routes: Routes): Promise<ServerContext> {
    // Get the routes' base URL.
    const baseUrl = new URL("./", routes.baseUrl).href;

    // Extract all routes, and prepare them into the `Page` structure.
    const pages: Page[] = [];
    let renderer: Renderer = DEFAULT_RENDERER;
    for (const [self, module] of Object.entries(routes.pages)) {
      const url = new URL(self, baseUrl).href;
      if (!url.startsWith(baseUrl)) {
        throw new TypeError("Page is not a child of the basepath.");
      }
      const path = url.substring(baseUrl.length).substring("pages".length);
      const baseRoute = path.substring(1, path.length - extname(path).length);
      const name = baseRoute.replace("/", "-");
      if (!path.startsWith("/_")) {
        const { default: component, config } = (module as PageModule);
        let route = pathToRoute(baseRoute);
        if (config?.routeOverride) {
          route = String(config.routeOverride);
        }
        let { handler } = (module as PageModule);
        handler ??= {};
        if (
          component &&
          typeof handler === "object" && handler.GET === undefined
        ) {
          handler.GET = ({ render }) => render!();
        }
        const page: Page = {
          route,
          url,
          name,
          component,
          handler,
          runtimeJS: Boolean(config?.runtimeJS ?? false),
        };
        pages.push(page);
      } else if (
        path === "/_render.tsx" || path === "/_render.ts" ||
        path === "/_render.jsx" || path === "/_render.js"
      ) {
        renderer = module as RendererModule;
      }
    }
    sortRoutes(pages);

    const staticFiles: [URL, string][] = [];
    try {
      const staticFolder = new URL("./static", routes.baseUrl);
      // TODO(lucacasonato): remove the extranious Deno.readDir when
      // https://github.com/denoland/deno_std/issues/1310 is fixed.
      for await (const _ of Deno.readDir(fromFileUrl(staticFolder))) {
        // do nothing
      }
      const entires = walk(fromFileUrl(staticFolder), {
        includeFiles: true,
        includeDirs: false,
        followSymlinks: false,
      });
      for await (const entry of entires) {
        const path = toFileUrl(entry.path);
        const subpath = path.href.substring(staticFolder.href.length);
        staticFiles.push([path, subpath]);
      }
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        // Do nothing.
      } else {
        throw err;
      }
    }
    return new ServerContext(pages, staticFiles, renderer);
  }

  /**
   * This functions returns a request handler that handles all routes required
   * by fresh, including static files.
   */
  handler(): router.RequestHandler {
    return router.router(this.#routes());
  }

  /**
   * This function returns all routes required by fresh as an extended
   * path-to-regex, to handler mapping.
   */
  #routes(): router.Routes {
    const routes: router.Routes = {};

    // Add the static file routes.
    for (const [fullPath, path] of this.#staticFiles) {
      const route = sanitizePathToRegex(path);
      routes[`GET@${route}`] = this.#staticFileHandler(fullPath);
    }

    for (const page of this.#pages) {
      const bundlePath = `/${page.name}.js`;
      const imports = page.runtimeJS ? [bundleAssetUrl(bundlePath)] : [];
      const createRender = (
        req: Request,
        params: Record<string, string | string[]>,
      ) => {
        if (page.component === undefined) return undefined;
        const render = async () => {
          const preloads = page.runtimeJS
            ? this.#bundler.getPreloads(bundlePath).map(bundleAssetUrl)
            : [];
          const body = await internalRender({
            page,
            imports,
            preloads,
            renderer: this.#renderer,
            url: new URL(req.url),
            params,
          });
          return new Response(body, {
            status: 200,
            headers: {
              "content-type": "text/html; charset=utf-8",
            },
          });
        };
        return render;
      };

      if (typeof page.handler === "function") {
        routes[page.route] = (req, match) =>
          (page.handler as Handler)({
            req,
            match,
            render: createRender(req, match.params),
          });
      } else {
        for (const [method, handler] of Object.entries(page.handler)) {
          routes[`${method}@${page.route}`] = (req, match) =>
            handler({ req, match, render: createRender(req, match.params) });
        }
      }
    }

    routes[`${INTERNAL_PREFIX}${JS_PREFIX}/${BUILD_ID}/:path*`] = this
      .#bundleAssetRoute();

    return routes;
  }

  #staticFileHandler(fullPath: URL): router.MatchHandler {
    return async (_req: Request) => {
      try {
        const data = await Deno.readFile(fullPath);
        const contentType = mediaTypeLookup(extname(fullPath.href)) ??
          "application/octet-stream";
        return new Response(data, { headers: { "content-type": contentType } });
      } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
          return new Response("404 Not Found", { status: 404 });
        }
        throw err;
      }
    };
  }

  /**
   * Returns a router that contains all fresh routes. Should be mounted at
   * constants.INTERNAL_PREFIX
   */
  #bundleAssetRoute = (): router.MatchHandler => {
    return async (_req, match) => {
      const path = `/${match.params.path}`;
      const file = await this.#bundler.get(path);
      let res;
      if (file) {
        const headers = new Headers({
          "Cache-Control": "public, max-age=604800, immutable",
        });

        const contentType = mediaTypeLookup(path);
        if (contentType) {
          headers.set("Content-Type", contentType);
        }

        res = new Response(file, {
          status: 200,
          headers,
        });
      }

      return res ?? new Response(null, {
        status: 404,
      });
    };
  };
}

function bundleAssetUrl(path: string) {
  return `${INTERNAL_PREFIX}${JS_PREFIX}/${BUILD_ID}${path}`;
}

const DEFAULT_RENDERER: Renderer = {
  render(_ctx, render) {
    render();
  },
  postRender(_ctx) {},
};

/**
 * Sort pages by their relative routing priority, based on the parts in the
 * route matcher
 */
function sortRoutes<T extends { route: string }>(routes: T[]) {
  routes.sort((a, b) => {
    const partsA = a.route.split("/");
    const partsB = b.route.split("/");
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i];
      const partB = partsB[i];
      if (partA === undefined) return -1;
      if (partB === undefined) return 1;
      if (partA === partB) continue;
      const priorityA = partA.startsWith(":") ? partA.endsWith("*") ? 0 : 1 : 2;
      const priorityB = partB.startsWith(":") ? partB.endsWith("*") ? 0 : 1 : 2;
      return Math.max(Math.min(priorityB - priorityA, 1), -1);
    }
    return 0;
  });
}

/** Transform a filesystem URL path to a `path-to-regex` style matcher. */
function pathToRoute(path: string): string {
  const parts = path.split("/");
  if (parts[parts.length - 1] === "index") {
    parts.pop();
  }
  const route = "/" + parts
    .map((part) => {
      if (part.startsWith("[...") && part.endsWith("]")) {
        return `:${part.slice(4, part.length - 1)}*`;
      }
      if (part.startsWith("[") && part.endsWith("]")) {
        return `:${part.slice(1, part.length - 1)}`;
      }
      return part;
    })
    .join("/");
  return route;
}

// Normalize a path for use in a URL. Returns null if the path is unparsable.
export function normalizeURLPath(path: string): string | null {
  try {
    const pathUrl = new URL("file:///");
    pathUrl.pathname = path;
    return pathUrl.pathname;
  } catch {
    return null;
  }
}

function sanitizePathToRegex(path: string): string {
  return path
    .replaceAll("\*", "\\*")
    .replaceAll("\+", "\\+")
    .replaceAll("\?", "\\?")
    .replaceAll("\{", "\\{")
    .replaceAll("\}", "\\}")
    .replaceAll("\(", "\\(")
    .replaceAll("\)", "\\)")
    .replaceAll("\:", "\\:");
}
