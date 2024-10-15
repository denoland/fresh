import { App, fsRoutes, staticFiles, trailingSlashes } from "fresh";

export const app = new App({ root: import.meta.url })
  .use(staticFiles())
  .use(trailingSlashes("never"));

await fsRoutes(app, {
  loadIsland: (path) => import(`./islands/${path}`),
  loadRoute: (path) => import(`./routes/${path}`),
});

console.log("================================");
await fsRoutes(app, {
  dir: "../fixture_island_groups",
  loadIsland: (path) => import(`../fixture_island_groups/islands/${path}`),
  loadRoute: (path) => import(`../fixture_island_groups/routes/${path}`),
});

if (import.meta.main) {
  await app.listen();
}
