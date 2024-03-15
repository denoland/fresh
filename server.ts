// import "./src/types.ts";
// export * from "./src/server/mod.ts";

export { type App, FreshApp, type ListenOptions } from "./src/_next/mod.ts";
export { defineHandlers, definePage } from "./src/_next/defines.ts";
export { type FreshContext } from "./src/_next/context.ts";
export { trailingSlashes } from "./src/_next/middlewares/trailing_slashes.ts";
export { freshStaticFiles } from "./src/_next/middlewares/static_files.ts";
export { fsRoutes } from "./src/_next/plugins/fs_routes.ts";
export { type RouteConfig } from "./src/_next/types.ts";

// FIXME: Move to separate export entry once we moved to JSR
export { tailwind } from "./src/_next/plugins/tailwind/mod.ts";

// Deprecate these
import { FreshContext } from "./src/_next/context.ts";
/**
 * @deprecated Use {@link FreshContext} instead.
 */
export type PageProps<Data = unknown, State = unknown> = FreshContext<
  State,
  Data
>;
