/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "$fresh/server.ts";
import routes from "./fresh.gen.ts";
import options from "./options.ts";

const experimentalDenoServe = Deno.args.includes("--experimental-deno-serve");

await start(routes, { ...options, experimentalDenoServe });
