export const MODE: "build" | "dev" | "prod" = "dev";
export const DENO_DEPLOYMENT_ID = Deno.env.get("DENO_DEPLOYMENT_ID");
export const INTERNAL_PREFIX = "/_frsh";
export const DEV_CLIENT_URL = `${INTERNAL_PREFIX}/fresh_dev_client.js`;
export const DEV_ERROR_OVERLAY_URL = `${INTERNAL_PREFIX}/error_overlay`;
export const ALIVE_URL = `${INTERNAL_PREFIX}/alive`;
export const JS_PREFIX = `/js`;
