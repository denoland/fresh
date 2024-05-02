export { App, type ListenOptions, type RouteCacheEntry } from "./app.ts";
export { trailingSlashes } from "./middlewares/trailing_slashes.ts";
export { fsRoutes, type FsRoutesOptions } from "./plugins/fs_routes/mod.ts";
export {
  type HandlerByMethod,
  type HandlerFn,
  type Render,
  type RouteData,
  type RouteHandler,
} from "./handlers.ts";
export { type RouteConfig } from "./types.ts";
export { type Middleware, type MiddlewareFn } from "./middlewares/mod.ts";
export { staticFiles } from "./middlewares/static_files.ts";
export { type Mode } from "./runtime/server/mod.tsx";
export { type FreshConfig, type ResolvedFreshConfig } from "./config.ts";
export { type FreshContext, type Island } from "./context.ts";
export { createHelpers, type Helpers } from "./helpers.ts";
export { type Method } from "./router.ts";

// Compat with older Fresh versions
export {
  type AppProps,
  defineApp,
  defineLayout,
  defineRoute,
  type ErrorPageProps,
  type LayoutProps,
  type PageProps,
  type RouteContext,
  type UnkownPageProps,
} from "./compat/server.ts";

import type { HandlerByMethod } from "./handlers.ts";
// deno-lint-ignore no-explicit-any
export type Handlers<T = any, State = Record<string, unknown>> =
  HandlerByMethod<T, State>;
