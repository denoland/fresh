// -- $std --
export {
  fromFileUrl,
  toFileUrl,
} from "https://deno.land/std@0.193.0/path/mod.ts";
export { escape as regexpEscape } from "https://deno.land/std@0.193.0/regexp/escape.ts";

// -- esbuild --
// @deno-types="https://deno.land/x/esbuild@v0.18.11/mod.d.ts"
import * as esbuildWasm from "https://deno.land/x/esbuild@v0.18.11/wasm.js";
import * as esbuildNative from "https://deno.land/x/esbuild@v0.18.11/mod.js";
// @ts-ignore trust me
// deno-lint-ignore no-deprecated-deno-api
const esbuild: typeof esbuildWasm = Deno.run === undefined
  ? esbuildWasm
  : esbuildNative;
const esbuildWasmURL = new URL("./esbuild_v0.18.11.wasm", import.meta.url).href;
export { esbuild, esbuildWasm as esbuildTypes, esbuildWasmURL };

export { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.1/mod.ts";
