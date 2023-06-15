/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

export {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.193.0/testing/asserts.ts";
export { assertSnapshot } from "https://deno.land/std@0.193.0/testing/snapshot.ts";
export {
  TextLineStream,
} from "https://deno.land/std@0.193.0/streams/text_line_stream.ts";
export { delay } from "https://deno.land/std@0.193.0/async/delay.ts";
export { retry } from "https://deno.land/std@0.193.0/async/retry.ts";
export {
  default as puppeteer,
  Page,
  /** @ts-ignore this does actually exist */
  PUPPETEER_REVISIONS,
} from "npm:puppeteer-core@20.7.1";
export * as puppeteerBrowsers from "npm:@puppeteer/browsers@1.4.1";
export { join } from "https://deno.land/std@0.190.0/path/mod.ts";
export { DenoDir } from "https://deno.land/x/deno_cache@0.4.1/mod.ts";
