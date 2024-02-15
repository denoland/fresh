/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

export {
  assert,
  assertEquals,
  assertExists,
  AssertionError,
  assertMatch,
  assertNotEquals,
  assertNotMatch,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from "https://deno.land/std@0.211.0/assert/mod.ts";
export { assertSnapshot } from "https://deno.land/std@0.211.0/testing/snapshot.ts";
export {
  TextLineStream,
} from "https://deno.land/std@0.211.0/streams/text_line_stream.ts";
export { delay } from "https://deno.land/std@0.211.0/async/delay.ts";
export { retry } from "https://deno.land/std@0.211.0/async/retry.ts";
export {
  default as puppeteer,
  Page,
} from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
export {
  Document,
  DOMParser,
  HTMLElement,
  HTMLMetaElement,
} from "https://esm.sh/linkedom@0.15.1";
export { defineConfig, type Preset } from "https://esm.sh/@twind/core@1.1.3";
export { default as presetTailwind } from "https://esm.sh/@twind/preset-tailwind@1.1.4";
export { copy } from "https://deno.land/std@0.211.0/fs/mod.ts";
export {
  basename,
  dirname,
  extname,
  fromFileUrl,
  join,
  relative,
  SEP,
  toFileUrl,
} from "https://deno.land/std@0.211.0/path/mod.ts";
export * as JSONC from "https://deno.land/std@0.211.0/jsonc/mod.ts";
export * as colors from "https://deno.land/std@0.211.0/fmt/colors.ts";
export { STATUS_CODE } from "https://deno.land/std@0.211.0/http/status.ts";
export { stripAnsiCode } from "https://deno.land/std@0.211.0/fmt/colors.ts";
export { default as $ } from "https://deno.land/x/dax@0.39.1/mod.ts";
