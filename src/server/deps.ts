// -- preact --
export { renderToString } from "https://x.lcas.dev/preact@10.5.12/ssr.js";

// -- std --
export { extname } from "https://deno.land/std@0.95.0/path/mod.ts";

// -- oak --
export * as oak from "https://deno.land/x/oak@v7.4.0/mod.ts";

// -- esbuild --
const start = new Date().getTime();
globalThis.performance = {
  now() {
    return new Date().getTime() - start;
  },
};
import * as esbuild from "https://gist.githubusercontent.com/lucacasonato/358c6b7e8198bfb2cf3d220e49fdcf5f/raw/257dbbbc87fb5f82052b0fa455bd73f4ed07dd81/esbuild-wasm.js";
export { esbuild };
export { denoPlugin } from "https://raw.githubusercontent.com/lucacasonato/esbuild_deno_loader/c5ee642f4552078324badbf1b541c7222c07d5ff/mod.ts";
