import { ServerContext } from "./context.ts";
import { Server } from "./deps.ts";
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

export async function getServer(
  routes: Manifest,
  opts: StartOptions = {},
): Promise<Server> {
  const ctx = await ServerContext.fromManifest(routes, opts);

  const server = new Server({
    handler: ctx.handler(),
    port: opts.port ?? 8000,
    hostname: opts.hostname ?? "0.0.0.0",
    onError: opts.onError,
    ...opts,
  });

  if (opts?.signal) {
    opts.signal.onabort = () => server.close();
  }

  return server;
}

export async function start(
  routes: Manifest,
  opts: StartOptions = {},
) {
  const server = await getServer(routes, opts);
  console.log(
    `Server listening on http://${opts?.hostname ?? "localhost"}:${
      opts?.port ?? 8000
    }`,
  );

  return await server.listenAndServe();
}
