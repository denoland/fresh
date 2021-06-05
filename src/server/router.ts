import { mediaTypeLookup, router } from "./deps.ts";
import { Bundler } from "./bundle.ts";
import { render } from "./render.ts";
import { ApiRoute, Page } from "./routes.ts";
import { BUILD_ID, INTERNAL_PREFIX, JS_PREFIX } from "./constants.ts";

/** This function installs all routes required by fresh onto an oak router. */
export function installRoutes(
  pages: Page[],
  apiRoutes: ApiRoute[],
): router.Routes {
  const bundler = new Bundler(pages);

  const routes: router.Routes = {};

  for (const page of pages) {
    const bundlePath = `/${page.name}.js`;
    const imports = [bundleAssetUrl(bundlePath)];
    routes[page.route] = (_, match) => {
      const preloads = bundler.getPreloads(bundlePath).map(bundleAssetUrl);
      return new Response(
        render(page, imports, preloads, match.params),
        {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        },
      );
    };
  }

  for (const apiRoute of apiRoutes) {
    routes[apiRoute.route] = apiRoute.handler;
  }

  routes[`${INTERNAL_PREFIX}${JS_PREFIX}/${BUILD_ID}/:path*`] =
    internalBundleAssetRoute(bundler);

  return routes;
}

function bundleAssetUrl(path: string) {
  return `${INTERNAL_PREFIX}${JS_PREFIX}/${BUILD_ID}${path}`;
}

/**
 * Returns a router that contains all fresh routes. Should be mounted at
 * constants.INTERNAL_PREFIX
 */
function internalBundleAssetRoute(bundler: Bundler): router.MatchHandler {
  return async (_req, match) => {
    const path = `/${match.params.path}`;
    const file = await bundler.get(path);
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
}
