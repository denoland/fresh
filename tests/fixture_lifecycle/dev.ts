#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";

import "$std/dotenv/load.ts";

globalThis.addEventListener("load", () => {
  console.log("load");
});

globalThis.addEventListener("beforeunload", () => {
  console.log("beforeunload");
});

globalThis.addEventListener("unload", () => {
  console.log("unload");
});

const ac = new AbortController();

await dev(import.meta.url, "./main.ts", {
  ...config,
  server: { ...config.server, signal: ac.signal },
});

setTimeout(() => ac.abort(), 2000);
