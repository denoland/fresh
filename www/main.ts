/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { FreshApp, freshStaticFiles, fsRoutes } from "@fresh/server";

export const app = new FreshApp({
  build: {
    target: "safari12",
  },
});

app.use(freshStaticFiles());

await fsRoutes(app, {
  dir: Deno.cwd(),
  loadIsland: (path) => import("./islands/" + path),
  loadRoute: (path) => import("./routes/" + path),
});

if (import.meta.main) {
  await app.listen();
}
