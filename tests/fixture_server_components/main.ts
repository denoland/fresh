/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "$fresh/server.ts";
import twind from "$fresh/plugins/twind.ts";
import manifest from "./fresh.gen.ts";

import twindConfig from "./twind.config.ts";
await start(manifest, { plugins: [twind(twindConfig)] });
