import { App, fsRoutes, staticFiles } from "@fresh/core";

export const app = new App()
  .use(staticFiles());

await fsRoutes(app, {
  dir: import.meta.dirname!,
  loadIsland: (path) => import("./islands/" + path),
  loadRoute: (path) => import("./routes/" + path),
});

if (import.meta.main) {
  await app.listen();
}
