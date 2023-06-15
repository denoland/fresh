import { join } from "https://deno.land/std@0.190.0/path/mod.ts";
import { DenoDir } from "https://deno.land/x/deno_cache@0.4.1/deno_dir.ts";
import {
  /** @ts-ignore this does actually exist */
  PUPPETEER_REVISIONS,
} from "npm:puppeteer-core@20.7.1";
import { Browser, install } from "npm:@puppeteer/browsers@1.4.1";

const dir = new DenoDir();
const path = join(
  dir.root,
  "puppeteer",
  "chrome",
  PUPPETEER_REVISIONS.chrome,
);
const installed = await install({
  cacheDir: path,
  browser: Browser.CHROME,
  buildId: PUPPETEER_REVISIONS.chrome,
});
console.log(installed.path);
