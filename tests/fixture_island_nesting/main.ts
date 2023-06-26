/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "$fresh/server.ts";
import { parseDenoFlags } from "../deps.ts";
import routes from "./fresh.gen.ts";

const flags = parseDenoFlags(Deno.args, {
  boolean: ["experimental-deno-serve"],
  string: ["certFile", "keyFile"]
})

await start(routes, {experimentalDenoServe: !!flags.experimentalDenoServe });
