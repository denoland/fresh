/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "$fresh/server.ts";
import twindPlugin from "$fresh/plugins/twind.ts";
import ga4Plugin from "$fresh/plugins/ga4.ts";

import manifest from "./fresh.gen.ts";
import twindConfig from "./twind.config.ts";

const GA4_MEASUREMENT_ID = Deno.env.get("GA4_MEASUREMENT_ID")  || "";

await start(manifest, { plugins: [ twindPlugin(twindConfig), ga4Plugin(GA4_MEASUREMENT_ID) ] });

