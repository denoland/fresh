// -- preact --
export { renderToString } from "https://esm.sh/preact-render-to-string@5.1.19?deps=preact@10.5.14";

// -- std --
export {
  extname,
  fromFileUrl,
  toFileUrl,
} from "https://deno.land/std@0.108.0/path/mod.ts";
export { walk } from "https://deno.land/std@0.108.0/fs/walk.ts";
export { listenAndServe } from "https://deno.land/std@0.108.0/http/server.ts";

// -- router --
export * as router from "https://crux.land/router@0.0.4";

// -- media types --
export { lookup as mediaTypeLookup } from "https://deno.land/x/media_types@v2.10.2/mod.ts";

// -- esbuild --
// @deno-types="https://unpkg.com/esbuild-wasm@0.11.19/esm/browser.d.ts"
import * as esbuildWasm from "https://gist.githubusercontent.com/lucacasonato/358c6b7e8198bfb2cf3d220e49fdcf5f/raw/3714cb0f59606eefc29ed0fea36d4cd93549938b/esbuild-wasm.js";
import * as esbuildNative from "https://deno.land/x/esbuild@v0.13.2/mod.js";
// @ts-ignore trust me
const esbuild: typeof esbuildWasm = Deno.run === undefined
  ? esbuildWasm
  : esbuildNative;
export { esbuild, esbuildWasm as esbuildTypes };
export { denoPlugin } from "https://deno.land/x/esbuild_deno_loader@0.3.0/mod.ts";
