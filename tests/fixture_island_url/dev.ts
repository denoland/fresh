#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";

await dev(import.meta.url, "./main.ts", {
  islandUrls: [
    "https://deno.land/x/fresh@1.5.2/tests/fixture/islands/Counter.tsx",
    "https://deno.land/x/fresh@1.5.2/tests/fixture/islands/folder/Counter.tsx",
  ],
});
