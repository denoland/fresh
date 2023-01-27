import { ServerContext } from "./context.ts";
import { serve, serveTls } from "./deps.ts";
export { Status } from "./deps.ts";
import {
  AppModule,
  ErrorPageModule,
  IslandModule,
  MiddlewareModule,
  RouteModule,
  StartOptions,
  TlsStartOptions,
  UnknownPageModule,
} from "./types.ts";
export type {
  AppProps,
  ErrorHandler,
  ErrorHandlerContext,
  ErrorPageProps,
  FreshOptions,
  Handler,
  HandlerContext,
  Handlers,
  MiddlewareHandler,
  MiddlewareHandlerContext,
  PageProps,
  Plugin,
  PluginRenderResult,
  PluginRenderScripts,
  PluginRenderStyleTag,
  RenderFunction,
  RouteConfig,
  StartOptions,
  UnknownHandler,
  UnknownHandlerContext,
  UnknownPageProps,
} from "./types.ts";
export { RenderContext } from "./render.ts";
export type { InnerRenderFunction } from "./render.ts";

export interface Manifest {
  routes: Record<
    string,
    | RouteModule
    | MiddlewareModule
    | AppModule
    | ErrorPageModule
    | UnknownPageModule
  >;
  islands: Record<string, IslandModule>;
  baseUrl: string;
  config?: DenoConfig;
}

export interface DenoConfig {
  importMap: string;
  compilerOptions?: {
    jsx?: string;
    jsxImportSource?: string;
  };
}

export { ServerContext };

export async function start(
  routes: Manifest,
  opts: StartOptions | TlsStartOptions = {},
) {
  opts.port ??= 8000;
  if ((opts as TlsStartOptions).keyFile || (opts as TlsStartOptions).certFile) {
    startTls(routes, opts as TlsStartOptions);
  } else {
    const ctx = await ServerContext.fromManifest(routes, opts);
    if (opts.experimentalDenoServe === true) {
      // @ts-ignore as `Deno.serve` is still unstable.
      await Deno.serve(ctx.handler() as Deno.ServeHandler, opts);
    } else {
      await serve(ctx.handler(), opts);
    }
  }
}

async function startTls(routes: Manifest, opts: TlsStartOptions) {
  const ctx = await ServerContext.fromManifest(routes, opts);
  if (opts.experimentalDenoServe === true) {
    const denoServeTlsOptions: StartOptions & { cert: string; key: string } = {
      cert: opts.certFile,
      key: opts.keyFile,
      hostname: opts.hostname,
      onError: opts.onError,
      onListen: opts.onListen,
      plugins: opts.plugins,
      render: opts.render,
      port: opts.port,
      signal: opts.signal,
      staticDir: opts.staticDir,
    };

    // @ts-ignore as `Deno.serve` is still unstable.
    await Deno.serve(ctx.handler() as Deno.ServeHandler, denoServeTlsOptions);
  } else {
    await serveTls(ctx.handler(), opts);
  }
}
