// -- std --
export {
  dirname,
  extname,
  fromFileUrl,
  join,
  toFileUrl,
} from "https://deno.land/std@0.190.0/path/mod.ts";
export { walk } from "https://deno.land/std@0.190.0/fs/walk.ts";
export { serve } from "https://deno.land/std@0.190.0/http/server.ts";
export type {
  ConnInfo,
  Handler as RequestHandler,
  ServeInit,
} from "https://deno.land/std@0.190.0/http/server.ts";
export { Status } from "https://deno.land/std@0.190.0/http/http_status.ts";
export {
  typeByExtension,
} from "https://deno.land/std@0.190.0/media_types/mod.ts";
export { toHashString } from "https://deno.land/std@0.190.0/crypto/to_hash_string.ts";
export { escape } from "https://deno.land/std@0.190.0/regexp/escape.ts";
export * as JSONC from "https://deno.land/std@0.190.0/jsonc/mod.ts";

// -- esbuild --
// @deno-types="https://deno.land/x/esbuild@v0.17.11/mod.d.ts"
import * as esbuildWasm from "https://deno.land/x/esbuild@v0.17.11/wasm.js";
import * as esbuildNative from "https://deno.land/x/esbuild@v0.17.11/mod.js";
// @ts-ignore trust me
// deno-lint-ignore no-deprecated-deno-api
const esbuild: typeof esbuildWasm = Deno.run === undefined
  ? esbuildWasm
  : esbuildNative;
export { esbuild, esbuildWasm as esbuildTypes };

export { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.7.0/mod.ts";
