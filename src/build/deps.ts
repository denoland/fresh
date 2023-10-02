// -- $std --
export {
  fromFileUrl,
  toFileUrl,
} from "https://deno.land/std@0.193.0/path/mod.ts";
export { escape as regexpEscape } from "https://deno.land/std@0.193.0/regexp/escape.ts";

// -- esbuild --
// @deno-types="https://deno.land/x/esbuild@v0.19.4/mod.d.ts"
import * as esbuildWasm from "https://deno.land/x/esbuild@v0.19.4/wasm.js";
import * as esbuildNative from "https://deno.land/x/esbuild@v0.19.4/mod.js";
// @ts-ignore trust me
// deno-lint-ignore no-deprecated-deno-api
const esbuild: typeof esbuildWasm = Deno.run === undefined
  ? esbuildWasm
  : esbuildNative;
const esbuildWasmURL = new URL("./esbuild_v0.19.4.wasm", import.meta.url).href;
export { esbuild, esbuildWasm as esbuildTypes, esbuildWasmURL };

export { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.2/mod.ts";
