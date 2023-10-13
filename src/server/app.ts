import { compose } from "./compose.ts";
import { InternalFreshConfig } from "./types.ts";
import {
  ALIVE_URL,
  JS_PREFIX,
  REFRESH_JS_URL,
} from "$fresh/src/server/constants.ts";
import { BUILD_ID } from "$fresh/src/server/build_id.ts";
import { MethodRouter } from "$fresh/src/server/compose_router.ts";
import { INTERNAL_PREFIX } from "$fresh/src/runtime/utils.ts";
import { staticFileMiddleware } from "$fresh/src/server/static_files.ts";
import { collectFreshFiles } from "$fresh/src/server/context.ts";
import { createAssetMiddleware } from "./middlewares/assets.ts";
import { aliveMiddleware, refreshJsMiddleware } from "./middlewares/alive.ts";
import { trailingSlashMiddleware } from "$fresh/src/server/middlewares/trialing_slash.ts";

export async function createFreshApp(
  config: InternalFreshConfig,
) {
  // Ensure that debugging hooks are set up for SSR rendering
  if (config.dev) {
    await import("preact/debug");
  }

  const state = await collectFreshFiles(config);

  const assetMiddleware = await createAssetMiddleware(config, state.islands);

  const router = new MethodRouter()
    .use(trailingSlashMiddleware(config.router.trailingSlash))
    // Bundled assets
    .get(
      `${INTERNAL_PREFIX}${JS_PREFIX}/${BUILD_ID}/:path*`,
      assetMiddleware,
    );

  // Development specific routes
  if (config.dev) {
    router
      .get(REFRESH_JS_URL, refreshJsMiddleware)
      .get(ALIVE_URL, aliveMiddleware);
  }

  const appRouter = new MethodRouter();

  for (let i = 0; i < state.routes.length; i++) {
    const route = state.routes[i];
  }

  // TODO: Make 404 route optional
  // appRouter.all("*", state.notFound);
  // for (const { module } of mws) {
  //   if (module.handler instanceof Array) {
  //     for (const handler of module.handler) {
  //       handlers.push(() => handler(req, middlewareCtx));
  //     }
  //   } else {
  //     const handler = module.handler;
  //     handlers.push(() => handler(req, middlewareCtx));
  //   }
  // }
  // TODO: On promise catch do error handler
  // TODO: Route destination

  router.all(
    "*",
    compose([
      // Static asset routes which falls through to next middleware
      // if none match
      staticFileMiddleware(config.staticDir),

      // App routes
      appRouter.handler(),
    ]),
  );

  return router;
}
