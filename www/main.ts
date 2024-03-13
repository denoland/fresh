/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { createApp } from "../src/_next/mod.ts";

// import manifest from "./fresh.gen.ts";
// import config from "./fresh.config.ts";

const app = createApp({
  plugins: [],
});

await app.listen();
