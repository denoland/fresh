/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { FreshApp } from "../src/_next/mod.ts";
import tailwind from "$fresh/src/_next/plugins/tailwind/mod.ts";
import { fsRoutes } from "$fresh/src/_next/plugins/fs_routes.ts";
import { freshStaticFiles } from "$fresh/src/_next/middlewares/static_files.ts";

// import manifest from "./fresh.gen.ts";
// import config from "./fresh.config.ts";

const app = new FreshApp({});

await tailwind(app, {});

app.use(freshStaticFiles());

await fsRoutes(app, {
  dir: Deno.cwd(),
  load: (path) => import("./routes/" + path),
});

await app.listen();
