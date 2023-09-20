import { LayoutConfig } from "$fresh/server.ts";
import { ComponentChildren } from "preact";
import { ServerContext } from "./context.ts";
export type { FromManifestOptions } from "./context.ts";
export { Status } from "./deps.ts";
import {
  ErrorHandler,
  Handler,
  Handlers,
  IslandModule,
  MiddlewareModule,
  RouteConfig,
  ServeHandlerInfo,
  StartOptions,
  UnknownHandler,
} from "./types.ts";
import { startFromContext } from "./boot.ts";
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
      ) => Promise<ComponentChildren | Response> | ComponentChildren;
      // deno-lint-ignore no-explicit-any
      handler?: Handler<any, any> | Handlers<any, any> | UnknownHandler;
      config?: RouteConfig | LayoutConfig | ErrorHandler;
    } | MiddlewareModule
  >;
  islands: Record<string, IslandModule>;
  baseUrl: string;
}

export { ServerContext };

export async function createHandler(
  routes: Manifest,
  opts: StartOptions = {},
): Promise<
  (req: Request, connInfo?: ServeHandlerInfo) => Promise<Response>
> {
  const ctx = await ServerContext.fromManifest(routes, opts);
  return ctx.handler();
}

export async function start(routes: Manifest, opts: StartOptions = {}) {
  const ctx = await ServerContext.fromManifest(routes, {
    ...opts,
    skipSnapshot: false,
    dev: false,
  });
  await startFromContext(ctx, opts);
}
