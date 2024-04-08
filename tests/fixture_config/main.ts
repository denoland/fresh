/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";

const TEST_CONFIG_SERVER = Deno.env.get("TEST_CONFIG_SERVER") === "true";
const onListen = (params: { hostname: string; port: number }) => {
  console.log("it works");
  console.log(`http://localhost:${params.port}`);
};
const onListen2 = (params: { hostname: string; port: number }) => {
  console.log("it works #2");
  console.log(`http://localhost:${params.port}`);
};

await start(manifest, {
  server: {
    onListen: TEST_CONFIG_SERVER ? onListen2 : undefined,
  },
  onListen: TEST_CONFIG_SERVER ? undefined : onListen,
});
