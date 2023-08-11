import { LayoutConfig } from "$fresh/server.ts";
import { ComponentChildren } from "preact";
import { ServerContext } from "./context.ts";
export { Status } from "./deps.ts";
import { colors, serve } from "./deps.ts";
import {
  ErrorHandler,
  Handler,
  Handlers,
  IslandModule,
  MiddlewareModule,
  RouteConfig,
  ServeHandler,
  ServeHandlerInfo,
  StartOptions,
  UnknownHandler,
} from "./types.ts";
export { defineApp, defineLayout, defineRoute } from "./defines.ts";
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
  compilerOptions?: {
    jsx?: string;
    jsxImportSource?: string;
  };
}

export { ServerContext };

// Helper to get autocompletion
export function defineConfig(config: StartOptions): StartOptions {
  return config;
}

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
  const ctx = await ServerContext.fromManifest(routes, opts);

  if (!opts.onListen) {
    opts.onListen = (params) => {
      console.log();
      console.log(
        colors.bgRgb8(colors.black(colors.bold(" 🍋 Fresh ready ")), 121),
      );

      const address = colors.cyan(`http://localhost:${params.port}/`);
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
        await bootServer(handler, { ...opts, port });
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

async function bootServer(handler: ServeHandler, opts: StartOptions) {
  // @ts-ignore Ignore type error when type checking with Deno versions
  if (typeof Deno.serve === "function") {
    // @ts-ignore Ignore type error when type checking with Deno versions
    await Deno.serve(opts, handler).finished;
  } else {
    // @ts-ignore Deprecated std serve way
    await serve(handler, opts);
  }
}
