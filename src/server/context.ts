import { extname, mediaTypeLookup, router } from "./deps.ts";
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
  #bundler: Bundler;
  #renderer: Renderer;

  constructor(pages: Page[], renderer: Renderer) {
    this.#pages = pages;
    this.#renderer = renderer;
    this.#bundler = new Bundler(pages);
  }

  /**
   * Process the routes into individual components and pages.
   */
  static fromRoutes(routes: Routes): ServerContext {
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
      const route = pathToRoute(baseRoute);
      const name = baseRoute.replace("/", "-");
      if (!path.startsWith("/_")) {
        const { default: component, config } = (module as PageModule);
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
          runtimeJS: config?.runtimeJS ?? true,
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

    return new ServerContext(pages, renderer);
  }

  /**
   * This function returns all routes required by fresh as an extended
   * path-to-regex, to handler mapping.
   */
  routes(): router.Routes {
    const routes: router.Routes = {};

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
