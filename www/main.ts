import { App, fsRoutes, trailingSlashes } from "fresh";

export const app = new App({ root: import.meta.url })
  .use(trailingSlashes("never"));

await fsRoutes(app, {
  loadIsland: (path) => import(`./islands/${path}`),
  loadRoute: (path) => import(`./routes/${path}`),
});

if (import.meta.main) {
  await app.listen();
}
