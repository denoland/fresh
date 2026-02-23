import { App, staticFiles, trailingSlashes } from "fresh";

console.log("BOOTING SERVER", App);

export const app = new App()
  .use(async (c) => {
    console.log("DEV SERVER");
    return c.next();
  })
  .use(staticFiles())
  .use(trailingSlashes("never"))
  .fsRoutes();
