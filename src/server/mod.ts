import { router } from "./deps.ts";
import {
  ApiRoute,
  ApiRouteModule,
  Page,
  PageModule,
  processRoutes,
} from "./routes.ts";
import { installRoutes } from "./router.ts";

export interface Routes {
  pages: Record<string, PageModule | ApiRouteModule>;
  baseUrl: string;
}

export { installRoutes, processRoutes, router };

export function start(routes: Routes) {
  const [pages, apiRoutes] = processRoutes(routes);
  const app = createDefaultRouter(pages, apiRoutes);
  addEventListener("fetch", (event: FetchEvent) => {
    event.respondWith(app(event.request));
  });
}

export function createDefaultRouter(
  pages: Page[],
  apiRoutes: ApiRoute[],
): router.RequestHandler {
  return router.router(installRoutes(pages, apiRoutes));
}
