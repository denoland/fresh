/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "$fresh/server.ts";
import routes from "./fresh.gen.ts";
import options from "./options.ts";

// this just exists to function as a type check to assert that we can actually pass a key and cert in
await start(routes, { ...options, key: "test", cert: "test" });
