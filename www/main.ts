/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { start } from "$fresh/server.ts";
import twindPlugin from "$fresh/plugins/twind.ts";

import manifest from "./fresh.gen.ts";
import twindConfig from "./twind.config.js";

await start(manifest, { plugins: [twindPlugin(twindConfig)] });
