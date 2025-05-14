import "./telemetry.ts";
import { App, fsRoutes, staticFiles, trailingSlashes } from "fresh";

export const app = new App({ root: import.meta.url })
  .use(staticFiles())
  .use(trailingSlashes("never"));

await fsRoutes(app, {
  loadIsland: (path) => import(`./islands/${path}`),
  loadRoute: (path) => import(`./routes/${path}`),
});

export default {
  fetch: app.handler(false),
} satisfies Deno.ServeDefaultExport;
