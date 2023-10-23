// -- $std --
export {
  fromFileUrl,
  join,
  relative,
  toFileUrl,
} from "https://deno.land/std@0.193.0/path/mod.ts";
export { escape as regexpEscape } from "https://deno.land/std@0.193.0/regexp/escape.ts";

export { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.2/mod.ts";

export {
  Deferred,
  deferred,
} from "https://deno.land/std@0.204.0/async/deferred.ts";
