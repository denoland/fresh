import { ServerContext } from "./context.ts";
import { serve } from "./deps.ts";
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

export async function start(
  routes: Manifest,
  opts: StartOptions = {},
) {
  const ctx = await ServerContext.fromManifest(routes, opts);
  console.log(
    `Server listening on http://${opts?.hostname ?? "localhost"}:${
      opts?.port ?? 8000
    }`,
  );
  await serve(ctx.handler(), opts);
}
