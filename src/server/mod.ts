import { ServerContext } from "./context.ts";
import { serve, parse } from "./deps.ts";
import { error } from "./error.ts";
import {
  AppModule,
  ErrorPageModule,
  IslandModule,
  MiddlewareModule,
  RouteModule,
  StartOptions,
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
  MiddlewareHandlerContext,
  PageProps,
  RenderFunction,
  RouteConfig,
  StartOptions,
  UnknownHandler,
  UnknownHandlerContext,
  UnknownPageProps,
} from "./types.ts";
export { RenderContext } from "./render.tsx";
export type { InnerRenderFunction } from "./render.tsx";

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

export { ServerContext };

type KeyOrValueOf<T> = keyof T | T[keyof T];

export async function start(routes: Manifest, opts: StartOptions = {}) {
  const aliases = {
    p: "port",
    H: "hostname",
    h: "help",
  } as const;

  let args: {
    [P in KeyOrValueOf<typeof aliases>]?: string;
  } = {};

  // Exit the process if Fresh is started with unknown options
  try {
    args = parse(Deno.args, {
      alias: aliases,
      // Treat all args as strings
      string: Object.entries(aliases).flat(),
      unknown: (arg) => {
        throw new Error(`Unknown or unexpected option: ${arg}`);
      },
    }) as typeof args;
  } catch (err) {
    error(err.message);
  }

  if (args.help) {
    console.log(`
      DESCRIPTION:
        Starts the application.

      USAGE:
        $ deno task start -p <port> -H <hostname>

      OPTIONS:
        --port, -p      A port number on which to start the application
        --hostname, -H  Hostname on which to start the application (default: 0.0.0.0)
        --help, -h      Displays this message
    `);
    Deno.exit(0);
  }

  const port: number =
    (args.port && parseInt(args.port)) ||
    (Deno.env.get("PORT") && parseInt(Deno.env.get("PORT")!)) ||
    opts.port ||
    8000;
  const hostname: string =
    args.hostname || Deno.env.get("HOSTNAME") || opts.hostname || "0.0.0.0";

  const ctx = await ServerContext.fromManifest(routes, opts);
  console.log(`Server listening on http://${hostname || "localhost"}:${port}`);
  await serve(ctx.handler(), { ...opts, port, hostname });
}
