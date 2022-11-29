#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";

await dev(import.meta.url, "./main.ts", [
  "./islands",
  "../shared_islands",
  "https://deno.land/x/fresh@1.1.2/tests/fixture/islands/Counter.tsx",
]);
