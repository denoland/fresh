import { ServerContext } from "./context.ts";
export type { FromManifestConfig, FromManifestOptions } from "./context.ts";
export { Status } from "./deps.ts";
import {
  ErrorHandler,
  FreshConfig,
  Handler,
  Handlers,
  IslandModule,
  LayoutConfig,
  MiddlewareModule,
  RouteConfig,
  ServeHandlerInfo,
  UnknownHandler,
} from "./types.ts";
import { startServer } from "./boot.ts";
export {
  defineApp,
  defineConfig,
  defineLayout,
  defineRoute,
} from "./defines.ts";
export type {
  AppContext,
  AppProps,
  DenoConfig,
  ErrorHandler,
  ErrorHandlerContext,
  ErrorPageProps,
  FreshConfig,
  FreshOptions,
  Handler,
  HandlerContext,
  Handlers,
  LayoutConfig,
  LayoutContext,
  LayoutProps,
  MiddlewareHandler,
  MiddlewareHandlerContext,
  MultiHandler,
  PageProps,
  Plugin,
  PluginAsyncRenderContext,
  PluginAsyncRenderFunction,
  PluginRenderContext,
  PluginRenderFunction,
  PluginRenderFunctionResult,
  PluginRenderResult,
  PluginRenderScripts,
  PluginRenderStyleTag,
  RenderFunction,
  RouteConfig,
  RouteContext,
  ServeHandlerInfo,
  StartOptions,
  UnknownHandler,
  UnknownHandlerContext,
  UnknownPageProps,
} from "./types.ts";
export { RenderContext } from "./render.ts";
export type { InnerRenderFunction } from "./render.ts";
export type { DestinationKind } from "./router.ts";

export interface Manifest {
  routes: Record<
    string,
    {
      // Use a more loose route definition type because
      // TS has trouble inferring normal vs aync functions. It cannot infer based on function arity
      default?: (
        // deno-lint-ignore no-explicit-any
        propsOrRequest: any,
        // deno-lint-ignore no-explicit-any
        ctx: any,
        // deno-lint-ignore no-explicit-any
      ) => Promise<any | Response> | any;
      handler?:
        // deno-lint-ignore no-explicit-any
        | Handler<any, any>
        // deno-lint-ignore no-explicit-any
        | Handlers<any, any>
        | UnknownHandler
        | ErrorHandler;
      config?: RouteConfig | LayoutConfig;
    } | MiddlewareModule
  >;
  islands: Record<string, IslandModule>;
  baseUrl: string;
}

export { ServerContext };

export async function createHandler(
  manifest: Manifest,
  config: FreshConfig = {},
): Promise<
  (req: Request, connInfo?: ServeHandlerInfo) => Promise<Response>
> {
  const ctx = await ServerContext.fromManifest(manifest, config);
  return ctx.handler();
}

export async function start(manifest: Manifest, config: FreshConfig = {}) {
  const ctx = await ServerContext.fromManifest(manifest, {
    ...config,
    skipSnapshot: false,
    dev: false,
  });
  await startServer(ctx.handler(), config.server ?? config);
}
