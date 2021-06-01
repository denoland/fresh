import { oak } from "./deps.ts";
import { Page, PageModule, processRoutes } from "./page.ts";
import { installRoutes } from "./router.ts";

export interface Routes {
  pages: Record<string, PageModule>;
  baseUrl: string;
}

export { installRoutes };

export function start(routes: Routes) {
  const pages = processRoutes(routes);
  const app = createDefaultServer(pages);
  app.addEventListener("error", (err) => {
    console.error(err.error);
  });

  addEventListener("fetch", app.fetchEventHandler());
}

export function createDefaultServer(pages: Page[]): oak.Application {
  const router = new oak.Router();

  installRoutes(router, pages);

  const app = new oak.Application();

  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
}
