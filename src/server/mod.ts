import { ServerContext } from "./context.ts";
import { listenAndServe } from "./deps.ts";
import {
  AppModule,
  IslandModule,
  MiddlewareModule,
  PageModule,
  RendererModule,
} from "./types.ts";
export type { Handler, HandlerContext, Handlers } from "./types.ts";
export { RenderContext } from "./render.tsx";
export type { RenderFn } from "./render.tsx";

export interface Manifest {
  routes: Record<
    string,
    PageModule | RendererModule | MiddlewareModule | AppModule
  >;
  islands: Record<string, IslandModule>;
  baseUrl: string;
}

export { ServerContext };

export async function start(routes: Manifest) {
  const ctx = await ServerContext.fromManifest(routes);
  console.log("Server listening on http://localhost:8000");
  await listenAndServe(":8000", ctx.handler());
}
