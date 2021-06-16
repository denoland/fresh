import { ServerContext } from "./context.ts";
import { router } from "./deps.ts";
import { ApiRouteModule, PageModule, RendererModule } from "./types.ts";
export { RenderContext } from "./render.tsx";
export type { RenderFn } from "./render.tsx";

export interface Routes {
  pages: Record<string, PageModule | ApiRouteModule | RendererModule>;
  baseUrl: string;
}

export { router, ServerContext };

export function start(routes: Routes) {
  const ctx = ServerContext.fromRoutes(routes);
  const app = router.router(ctx.routes());
  addEventListener("fetch", (event: FetchEvent) => {
    event.respondWith(app(event.request));
  });
}
