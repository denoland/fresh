import { App, staticFiles, trailingSlashes } from "fresh";

export const app = new App()
  .use(staticFiles())
  .use(trailingSlashes("never"))
  .get("/", () => new Response("it works"))
  .fsRoutes();
