import "./telemetry.ts";
import { App, fsRoutes, staticFiles, trailingSlashes } from "fresh";

const cache = await caches.open("fresh");

export const app = new App({ root: import.meta.url, cache })
  .use(staticFiles())
  .use(trailingSlashes("never"));

await fsRoutes(app, {
  loadIsland: (path) => import(`./islands/${path}`),
  loadRoute: (path) => import(`./routes/${path}`),
});

if (import.meta.main) {
  await app.listen();
}
