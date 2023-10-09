import { INTERNAL_PREFIX } from "../runtime/utils.ts";
import { BUILD_ID } from "./build_id.ts";

export const REFRESH_JS_URL = `${INTERNAL_PREFIX}/refresh.js`;
export const ALIVE_URL = `${INTERNAL_PREFIX}/alive`;
export const JS_PREFIX = `/js`;
export const DEBUG = !Deno.env.get("DENO_DEPLOYMENT_ID");

export function bundleAssetUrl(path: string) {
  const CDN_URL = Deno.env.get("CDN_URL");
  const assetPath = `${INTERNAL_PREFIX}${JS_PREFIX}/${BUILD_ID}${path}`;
  return CDN_URL ? `${CDN_URL}/${BUILD_ID}/_fresh${path}` : assetPath;
}
