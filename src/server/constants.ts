import { INTERNAL_PREFIX } from "../runtime/utils.ts";

export const REFRESH_JS_URL = `${INTERNAL_PREFIX}/refresh.js`;
export const ALIVE_URL = `${INTERNAL_PREFIX}/alive`;
const deploymentId = Deno.env.get("DENO_DEPLOYMENT_ID") ||
  crypto.randomUUID();
export const BUILD_ID = await crypto.subtle.digest(
  "SHA-1",
  new TextEncoder().encode(deploymentId),
).then((hash) =>
  Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
);
export const JS_PREFIX = `/js`;
export const DEBUG = !Deno.env.get("DENO_DEPLOYMENT_ID");

export function bundleAssetUrl(path: string) {
  return `${INTERNAL_PREFIX}${JS_PREFIX}/${BUILD_ID}${path}`;
}

globalThis.__FRSH_BUILD_ID = BUILD_ID;

declare global {
  interface Crypto {
    randomUUID(): string;
  }

  // deno-lint-ignore no-var
  var __FRSH_BUILD_ID: string;
}
