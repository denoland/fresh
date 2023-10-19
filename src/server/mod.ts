import { getServerContext, ServerContext } from "./context.ts";
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
import { getFreshConfigWithDefaults } from "$fresh/src/server/config.ts";
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

// deno-lint-ignore no-explicit-any
function isManifest(x: any): x is Manifest {
  return x !== null && typeof x === "object" && typeof x.routes === "object" &&
    typeof x.islands === "object" && typeof x.baseUrl === "string";
}

export async function start(
  config: FreshConfig,
): Promise<void>;
export async function start(
  manifest: Manifest,
  config?: FreshConfig,
): Promise<void>;
export async function start(
  manifestOrConfig: Manifest | FreshConfig,
  optionalConfig?: FreshConfig,
): Promise<void> {
  let config: FreshConfig;
  let manifest: Manifest | undefined;
  if (isManifest(manifestOrConfig)) {
    manifest = manifestOrConfig;
    config = optionalConfig ?? {};
  } else {
    manifest = undefined;
    config = manifestOrConfig;
  }

  const configWithDefaults = await getFreshConfigWithDefaults(
    config,
    manifest,
  );
  configWithDefaults.dev = false;

  const ctx = await getServerContext(configWithDefaults);
  await startServer(ctx.handler(), configWithDefaults.server);
}
