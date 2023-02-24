// -- std --
export {
  extname,
  fromFileUrl,
  toFileUrl,
} from "https://deno.land/std@0.177.0/path/mod.ts";
export { walk } from "https://deno.land/std@0.177.0/fs/walk.ts";
export { serve } from "https://deno.land/std@0.177.0/http/server.ts";
export type {
  ConnInfo,
  Handler as RequestHandler,
  ServeInit,
} from "https://deno.land/std@0.177.0/http/server.ts";
export { Status } from "https://deno.land/std@0.177.0/http/http_status.ts";
export {
  typeByExtension,
} from "https://deno.land/std@0.177.0/media_types/mod.ts";

// -- rutt --
export * as rutt from "https://deno.land/x/rutt@0.1.0/mod.ts";

// -- esbuild --
// @deno-types="https://deno.land/x/esbuild@v0.17.2/mod.d.ts"
import * as esbuildWasm from "https://deno.land/x/esbuild@v0.17.2/wasm.js";
import * as esbuildNative from "https://deno.land/x/esbuild@v0.17.2/mod.js";
// @ts-ignore trust me
const esbuild: typeof esbuildWasm = Deno.run === undefined
  ? esbuildWasm
  : esbuildNative;
export { esbuild, esbuildWasm as esbuildTypes };
// TODO(lino-levan): replace with tagged version
export { denoPlugin } from "https://raw.githubusercontent.com/lucacasonato/esbuild_deno_loader/b4b3ffb43e9380865ad12ab4d1c64c0ae0ca96cd/mod.ts";
