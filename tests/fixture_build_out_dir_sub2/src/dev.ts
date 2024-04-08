#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";

await dev(import.meta.url, "./main.ts", {
  build: {
    outDir: Deno.env.get("FRESH_TEST_OUTDIR") ?? undefined,
  },
});
