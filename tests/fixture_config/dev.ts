#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";

const TEST_CONFIG_SERVER = Deno.env.get("TEST_CONFIG_SERVER") === "true";
const onListen = (params: { hostname: string; port: number }) => {
  console.log("it works");
  console.log(`http://localhost:${params.port}`);
};
const onListen2 = (params: { hostname: string; port: number }) => {
  console.log("it works #2");
  console.log(`http://localhost:${params.port}`);
};

await dev(import.meta.url, "./main.ts", {
  server: {
    onListen: TEST_CONFIG_SERVER ? onListen2 : undefined,
  },
  onListen: TEST_CONFIG_SERVER ? undefined : onListen,
});
