import { App, staticFiles, trailingSlashes } from "fresh";

export const app = new App()
  .use(staticFiles())
  .use(trailingSlashes("never"))
  .fsRoutes();
