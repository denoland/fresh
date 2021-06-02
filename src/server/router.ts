import { extname, oak } from "./deps.ts";
import { Bundler } from "./bundle.ts";
import { render } from "./render.ts";
import { ApiRoute, Page } from "./routes.ts";
import { BUILD_ID, INTERNAL_PREFIX, JS_PREFIX } from "./constants.ts";

/** This function installs all routes required by fresh onto an oak router. */
export function installRoutes(
  router: oak.Router,
  pages: Page[],
  apiRoutes: ApiRoute[],
) {
  const bundler = new Bundler(pages);

  for (const page of pages) {
    const bundlePath = `/${page.name}.js`;
    const imports = [bundleAssetUrl(bundlePath)];
    router.get<Record<string, string>>(page.route, (ctx) => {
      ctx.response.status = 200;
      ctx.response.type = "html";
      const preloads = bundler.getPreloads(bundlePath).map(bundleAssetUrl);
      ctx.response.body = render(page, imports, preloads, ctx.params);
    });
  }

  for (const apiRoute of apiRoutes) {
    router.all(apiRoute.route, apiRoute.handler);
  }

  const internal = internalRouter(bundler);

  router.use(
    INTERNAL_PREFIX,
    internal.routes(),
    internal.allowedMethods(),
  );
}

function bundleAssetUrl(path: string) {
  return `${INTERNAL_PREFIX}${JS_PREFIX}/${BUILD_ID}${path}`;
}

/**
 * Returns a router that contains all fresh routes. Should be mounted at
 * constants.INTERNAL_PREFIX
 */
function internalRouter(bundler: Bundler): oak.Router {
  const router = new oak.Router();

  router.get(`${JS_PREFIX}/${BUILD_ID}/:path*`, async (ctx) => {
    const path = `/${ctx.params.path}`;
    const file = await bundler.get(path);
    if (file) {
      ctx.response.status = 200;
      ctx.response.type = extname(path);
      ctx.response.body = file;
      ctx.response.headers.set(
        "Cache-Control",
        "public, max-age=604800, immutable",
      );
    }
  });

  return router;
}
