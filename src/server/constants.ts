import { INTERNAL_PREFIX } from "../runtime/utils.ts";
import { INTERNAL_ASSET_PATH_PREFIX } from "./asset_path.ts";

export const REFRESH_JS_URL = `${INTERNAL_PREFIX}/refresh.js`;
export const ALIVE_URL = `${INTERNAL_PREFIX}/alive`;
export const JS_PREFIX = `/js`;
export const DEBUG = !Deno.env.get("DENO_DEPLOYMENT_ID");

export function bundleAssetUrl(path: string) {
  return `${INTERNAL_ASSET_PATH_PREFIX}${path}`;
  // return cdnUrl ? `${cdnUrl}/${BUILD_ID}/_fresh${path}` : fullPath;
}
