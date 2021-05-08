// -- preact --
export { renderToString } from "https://x.lcas.dev/preact@10.5.12/ssr.js";

// -- std --
export { extname } from "https://deno.land/std@0.95.0/path/mod.ts";

// -- oak --
export * as oak from "https://deno.land/x/oak@v7.4.0/mod.ts";

// -- esbuild --
let start = new Date().getTime();
globalThis.performance = {
  now() {
    return new Date().getTime() - start;
  },
};
// @deno-types="https://unpkg.com/esbuild-wasm@0.11.19/esm/browser.d.ts"
import * as esbuild from "https://gist.githubusercontent.com/lucacasonato/358c6b7e8198bfb2cf3d220e49fdcf5f/raw/3714cb0f59606eefc29ed0fea36d4cd93549938b/esbuild-wasm.js";
export { esbuild };
export { denoPlugin } from "https://raw.githubusercontent.com/lucacasonato/esbuild_deno_loader/fa2219c3df9494da6c33e3e4dffb1a33b5cc0345/mod.ts";
