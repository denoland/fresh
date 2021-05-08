import { createPages, PageModules } from "./routes.ts";
import { createServer } from "./server.ts";

export function setup(pageModules: PageModules[], selfUrl: string) {
  const baseUrl = new URL("./", selfUrl).href;
  const pages = createPages(pageModules, baseUrl);
  const app = createServer(pages);
  app.addEventListener("error", (err) => {
    console.error(err);
  });

  addEventListener("fetch", app.fetchEventHandler());
}
