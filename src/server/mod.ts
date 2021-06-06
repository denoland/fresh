import { router } from "./deps.ts";
import { ApiRouteModule, PageModule, ServerContext } from "./routes.ts";
import { DocumentModule } from "./document.tsx";

export type {
  DocumentProps,
  DocumentRenderOptions,
  DocumentRenderReturn,
} from "./document.tsx";

export interface Routes {
  pages: Record<string, PageModule | ApiRouteModule | DocumentModule>;
  baseUrl: string;
}

export { ServerContext };

export function start(routes: Routes) {
  const serverCtx = ServerContext.fromRoutes(routes);
  const app = router.router(serverCtx.routes());
  addEventListener("fetch", (event: FetchEvent) => {
    event.respondWith(app(event.request));
  });
}
