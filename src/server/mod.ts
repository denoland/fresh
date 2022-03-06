import { ServerContext } from "./context.ts";
import { serve } from "./deps.ts";
import {
  AppModule,
  ErrorPageModule,
  IslandModule,
  MiddlewareModule,
  PageModule,
  RendererModule,
  UnknownPageModule,
} from "./types.ts";
export type {
  Handler,
  HandlerContext,
  Handlers,
  MiddlewareHandlerContext,
} from "./types.ts";
export { RenderContext } from "./render.tsx";
export type { RenderFn } from "./render.tsx";

export interface Manifest {
  routes: Record<
    string,
    | PageModule
    | RendererModule
    | MiddlewareModule
    | AppModule
    | ErrorPageModule
    | UnknownPageModule
  >;
  islands: Record<string, IslandModule>;
  baseUrl: string;
}

export { ServerContext };

export async function start(routes: Manifest) {
  const ctx = await ServerContext.fromManifest(routes);
  console.log("Server listening on http://localhost:8000");
  await serve(ctx.handler(), {
    port: 8000,
  });
}
