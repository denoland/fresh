import "./telemetry.ts";
import {
  App,
  fsRoutes,
  serverCache,
  staticFiles,
  trailingSlashes,
} from "fresh";

export const app = new App({ root: import.meta.url })
  .use(serverCache(await caches.open("fresh-cache")))
  .use(staticFiles())
  .use(trailingSlashes("never"));

await fsRoutes(app, {
  loadIsland: (path) => import(`./islands/${path}`),
  loadRoute: (path) => import(`./routes/${path}`),
});

if (import.meta.main) {
  await app.listen();
}
