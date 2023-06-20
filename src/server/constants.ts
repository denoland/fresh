import { BUILD_ID } from "./build_id.ts";

export const INTERNAL_PREFIX = Deno.env.get("FRESH_INTERNAL_PREFIX") ||
  "/_frsh";
export const REFRESH_JS_URL = `${INTERNAL_PREFIX}/refresh.js`;
export const ALIVE_URL = `${INTERNAL_PREFIX}/alive`;
export const JS_PREFIX = `/js`;
export const DEBUG = !Deno.env.get("DENO_DEPLOYMENT_ID");

export function bundleAssetUrl(path: string) {
  return `${INTERNAL_PREFIX}${JS_PREFIX}/${BUILD_ID}${path}`;
}
