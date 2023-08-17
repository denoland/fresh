/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "$fresh/server.ts";
import twind from "$fresh/plugins/twind.ts";
import twindV1 from "$fresh/plugins/twindv1.ts";
import manifest from "./fresh.gen.ts";

const twindPlugin = Deno.env.has("TWIND_V1")
  ? twindV1({
    selfURL: import.meta.url,
    // deno-lint-ignore no-explicit-any
  } as any)
  : twind({ selfURL: import.meta.url });

await start(manifest, { plugins: [twindPlugin] });
