#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";
import twindPlugin from "$fresh/plugins/twind.ts";
import twindConfig from "./twind.config.ts";

await dev(import.meta.url, "./main.ts", {
  plugins: [twindPlugin(twindConfig)],
});
