import { oak } from "./deps.ts";
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

export { installRoutes, oak, processRoutes };

export function start(routes: Routes) {
  const [pages, apiRoutes] = processRoutes(routes);
  const app = createDefaultServer(pages, apiRoutes);
  app.addEventListener("error", (err) => {
    console.error(err.error);
  });

  addEventListener("fetch", app.fetchEventHandler());
}

export function createDefaultServer(
  pages: Page[],
  apiRoutes: ApiRoute[],
): oak.Application {
  const router = new oak.Router();

  installRoutes(router, pages, apiRoutes);

  const app = new oak.Application();

  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
}
