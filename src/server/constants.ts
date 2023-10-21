import { INTERNAL_PREFIX } from "../runtime/utils.ts";
import { BUILD_ID } from "./build_id.ts";

export const DEV_CLIENT_URL = `${INTERNAL_PREFIX}/client.js`;
export const ALIVE_URL = `${INTERNAL_PREFIX}/alive`;
export const JS_PREFIX = `/js`;
export const DEBUG = !Deno.env.get("DENO_DEPLOYMENT_ID");
export const BUNDLE_PUBLIC_PATH = `${INTERNAL_PREFIX}${JS_PREFIX}/${BUILD_ID}`;

export function bundleAssetUrl(path: string) {
  return `${BUNDLE_PUBLIC_PATH}${path}`;
}
