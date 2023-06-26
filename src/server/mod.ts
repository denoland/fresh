import { ServerContext } from "./context.ts";
import * as colors from "https://deno.land/std@0.190.0/fmt/colors.ts";
import { ServeHandler, serve, serveTls } from "./deps.ts";
export { Status } from "./deps.ts";
import {
  AppModule,
  ErrorPageModule,
  IslandModule,
  MiddlewareModule,
  RouteModule,
  FreshStartOptions,
  FreshStartTlsOptions,
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
  FreshStartOptions,
  FreshStartTlsOptions,
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
}

export interface DenoConfig {
  imports?: Record<string, string>;
  importMap?: string;
  compilerOptions?: {
    jsx?: string;
    jsxImportSource?: string;
  };
}

export { ServerContext };



export async function start(routes: Manifest, opts: FreshStartOptions | FreshStartTlsOptions = {}) {
  const ctx = await ServerContext.fromManifest(routes, opts);
  const tls = modeTls(opts)

  if (!opts.onListen) {
    opts.onListen = (params: { hostname: string; port: number; }) => {
      console.log(
        colors.bgRgb8(colors.black(colors.bold("\n 🍋 Fresh ready ")), 121),
      );

      const address = colors.cyan(
        `${tls ? 'https' : 'http'}://localhost:${params.port}/`,
      );
      const localLabel = colors.bold("Local:");
      console.log(`    ${localLabel} ${address}\n`);
    };
  }

  const portEnv = Deno.env.get("PORT");
  if (portEnv !== undefined) {
    opts.port ??= parseInt(portEnv, 10);
  }

  const handler = ctx.handler();

  if (opts.port) {
    await bootServer(handler, opts);
  } else {
    // No port specified, check for a free port. Instead of picking just
    // any port we'll check if the next one is free for UX reasons.
    // That way the user only needs to increment a number when running
    // multiple apps vs having to remember completely different ports.
    let firstError;
    for (let port = 8000; port < 8020; port++) {
      try {
        if (tls) {
          await bootServerTls(handler, { ...opts, port });

        } else {
          await bootServer(handler, { ...opts, port });
        }
        firstError = undefined;
        break;
      } catch (err) {
        if (err instanceof Deno.errors.AddrInUse) {
          // Throw first EADDRINUSE error
          // if no port is free
          if (!firstError) {
            firstError = err;
          }
          continue;
        }

        throw err;
      }
    }

    if (firstError) {
      throw firstError;
    }
  }
}

function modeTls(opts: FreshStartOptions | FreshStartTlsOptions): boolean {
  return !!(opts as FreshStartTlsOptions)?.keyFile || !!(opts as FreshStartTlsOptions)?.certFile
}

async function bootServer(handler: ServeHandler, opts: FreshStartOptions | FreshStartTlsOptions) {
  if (opts.experimentalDenoServe) {
    // @ts-ignore as `Deno.serve` is still unstable.
    await Deno.serve({ ...opts, handler }).finished;
  } else {
    await serve(handler, opts);
  }
}

async function bootServerTls(handler: ServeHandler, opts: FreshStartTlsOptions) {
  if (opts.experimentalDenoServe) {
    const denoServeExperimentalTlsOptions: FreshStartTlsOptions = {
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
    await Deno.serve(handler, denoServeExperimentalTlsOptions);
  } else {
    await serveTls(handler, opts);
  }
}
