import { extname, mediaTypeLookup, router } from "./deps.ts";
import { Routes } from "./mod.ts";
import { Bundler } from "./bundle.ts";
import { INTERNAL_PREFIX } from "./constants.ts";
import { JS_PREFIX } from "./constants.ts";
import { BUILD_ID } from "./constants.ts";
import {
  ApiRoute,
  ApiRouteModule,
  Page,
  PageModule,
  Renderer,
  RendererModule,
} from "./types.ts";
import { render } from "./render.tsx";

export class ServerContext {
  #pages: Page[];
  #apiRoutes: ApiRoute[];
  #bundler: Bundler;
  #renderer: Renderer;

  constructor(pages: Page[], apiRoutes: ApiRoute[], renderer: Renderer) {
    this.#pages = pages;
    this.#apiRoutes = apiRoutes;
    this.#renderer = renderer;
    this.#bundler = new Bundler(pages);
  }

  /**
   * Process the routes into individual components and pages.
   */
  static fromRoutes(routes: Routes): ServerContext {
    // Get the routes' base URL.
    const baseUrl = new URL("./", routes.baseUrl).href;

    // Extract all pages, and prepare them into this `Page` structure.
    const pages: Page[] = [];
    const apiRoutes: ApiRoute[] = [];
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
      if (path.startsWith("/api/")) {
        const handlers = Object.fromEntries(
          Object.entries(module as ApiRouteModule).filter(([method]) =>
            method === "default" ||
            (router.METHODS as readonly string[]).includes(method)
          ),
        );
        const apiRoute: ApiRoute = {
          route,
          url,
          name,
          handlers,
        };
        apiRoutes.push(apiRoute);
      } else if (!path.startsWith("/_")) {
        const { default: component, config } = (module as PageModule);
        const page: Page = {
          route,
          url,
          name,
          component,
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
    sortRoutes(apiRoutes);

    return new ServerContext(pages, apiRoutes, renderer);
  }

  /**
   * This function returns all routes required by fresh as an extended
   * path-to-regex, to handler mapping.
   */
  routes(): router.Routes {
    const routes: router.Routes = {};

    for (const page of this.#pages) {
      const bundlePath = `/${page.name}.js`;
      const imports = [bundleAssetUrl(bundlePath)];
      routes[page.route] = async (_, match) => {
        const preloads = this.#bundler.getPreloads(bundlePath).map(
          bundleAssetUrl,
        );
        const body = await render({
          page,
          imports: page.runtimeJS ? imports : [],
          preloads: page.runtimeJS ? preloads : [],
          renderer: this.#renderer,
          params: match.params,
        });
        return new Response(body, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
          },
        });
      };
    }

    for (const { route, handlers } of this.#apiRoutes) {
      for (const [method, handler] of Object.entries(handlers)) {
        if (handler) {
          if (method === "default") {
            routes[route] = handler;
          } else {
            routes[`${method}@${route}`] = handler;
          }
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
