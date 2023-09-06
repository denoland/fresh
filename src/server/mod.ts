import { LayoutConfig } from "$fresh/server.ts";
import { ComponentChildren } from "preact";
import { ServerContext } from "./context.ts";
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

export interface DenoConfig {
  imports?: Record<string, string>;
  importMap?: string;
  tasks?: Record<string, string>;
  lint?: {
    rules: { tags?: string[] };
    exclude?: string[];
  };
  fmt?: {
    exclude?: string[];
  };
  compilerOptions?: {
    jsx?: string;
    jsxImportSource?: string;
  };
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
  console.time("start");
  console.time("fromManifest");
  const ctx = await ServerContext.fromManifest(routes, opts);
  console.timeEnd("fromManifest");
  await startFromContext(ctx, opts);
}
