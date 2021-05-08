// -- preact --
export { renderToString } from "https://x.lcas.dev/preact@10.5.12/ssr.js";

// -- std --
export { extname } from "https://deno.land/std@0.95.0/path/mod.ts";

// -- oak --
export * as oak from "https://deno.land/x/oak@v7.4.0/mod.ts";

// -- esbuild --
let now = 1;
globalThis.performance = {
  now() {
    now++;
    console.log(now);
    return now;
  },
};
import * as esbuild from "https://gist.githubusercontent.com/lucacasonato/766a6589f536f5536d98b1034a5d51d67c129d85/raw/137ef6cb91788d8f5d06a25f11eabd455acdd2e6/esbuild-wasm.js";
export { esbuild };
export { denoPlugin } from "https://raw.githubusercontent.com/lucacasonato/esbuild_deno_loader/c5ee642f4552078324badbf1b541c7222c07d5ff/mod.ts";
