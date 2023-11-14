/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "$fresh/server.ts";

import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";

throw new Error("This file should not be imported");

await start(manifest, config);
