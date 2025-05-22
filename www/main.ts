import "./telemetry.ts";
import { App, cache, fsRoutes, staticFiles, trailingSlashes } from "fresh";

export const app = new App({ root: import.meta.url })
  .use(staticFiles())
  .use(trailingSlashes("never"))
  .use(cache(await caches.open("fresh-cache")));

await fsRoutes(app, {
  loadIsland: (path) => import(`./islands/${path}`),
  loadRoute: (path) => import(`./routes/${path}`),
});

if (import.meta.main) {
  await app.listen();
}
