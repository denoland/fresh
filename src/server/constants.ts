export const INTERNAL_PREFIX = "/_frsh";
export const REFRESH_JS_URL = `${INTERNAL_PREFIX}/refresh.js`;
export const ALIVE_URL = `${INTERNAL_PREFIX}/alive`;
export const BUILD_ID = Deno.env.get("DENO_DEPLOYMENT_ID") ||
  crypto.randomUUID();
export const JS_PREFIX = `/js`;

declare global {
  interface Crypto {
    randomUUID(): string;
  }
}
