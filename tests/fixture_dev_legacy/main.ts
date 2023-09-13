/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import twind from "$fresh/plugins/twind.ts";

await start(manifest, { plugins: [twind({ selfURL: import.meta.url })] });
