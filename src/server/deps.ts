// -- std --
export {
  extname,
  fromFileUrl,
  toFileUrl,
} from "https://deno.land/std@0.150.0/path/mod.ts";
export { walk } from "https://deno.land/std@0.150.0/fs/walk.ts";
export { serve } from "https://deno.land/std@0.150.0/http/server.ts";
export type {
  ConnInfo,
  Handler as RequestHandler,
  ServeInit,
} from "https://deno.land/std@0.150.0/http/server.ts";
export { Status } from "https://deno.land/std@0.150.0/http/http_status.ts";
export {
  typeByExtension,
} from "https://deno.land/std@0.150.0/media_types/mod.ts";

// -- router --
export * as router from "https://crux.land/router@0.0.11";

// -- esbuild --
// @deno-types="https://deno.land/x/esbuild@v0.14.51/mod.d.ts"
import * as esbuildWasm from "https://deno.land/x/esbuild@v0.14.51/wasm.js";
import * as esbuildNative from "https://deno.land/x/esbuild@v0.14.51/mod.js";
// @ts-ignore trust me
const esbuild: typeof esbuildWasm = Deno.run === undefined
  ? esbuildWasm
  : esbuildNative;
export { esbuild, esbuildWasm as esbuildTypes };
export { denoPlugin } from "https://deno.land/x/esbuild_deno_loader@0.5.2/mod.ts";
