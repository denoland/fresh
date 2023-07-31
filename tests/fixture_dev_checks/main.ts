/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import notCallingCtxRender from "./plugins/not_calling_ctx_render.ts";
import notHavingModules from "./plugins/not_having_modules.ts";

await start(manifest, {
  plugins: [notHavingModules(), notCallingCtxRender()],
  staticDir: "./custom_static",
});
