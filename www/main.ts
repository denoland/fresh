/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import {
  FreshApp,
  freshStaticFiles,
  fsRoutes,
  tailwind,
} from "$fresh/server.ts";

const app = new FreshApp({
  build: {
    target: "safari12",
  },
});

await tailwind(app, {});

app.use(freshStaticFiles());

await fsRoutes(app, {
  dir: Deno.cwd(),
  load: (path) => import("./routes/" + path),
});

await app.listen();
