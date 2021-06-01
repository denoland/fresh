import { APIModule, createAPIs, createPages, PageModule } from "./routes.ts";
import { createServer } from "./server.ts";

export function setup(
  pageModules: [PageModule, string][],
  apiModules: [APIModule, string][],
  selfUrl: string,
) {
  const baseUrl = new URL("./", selfUrl).href;
  const pages = createPages(pageModules, baseUrl);
  const apis = createAPIs(apiModules, baseUrl);
  const app = createServer(pages, apis);
  app.addEventListener("error", (err) => {
    console.error(err.error);
  });

  addEventListener("fetch", app.fetchEventHandler());
}
