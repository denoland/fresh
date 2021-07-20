export const INTERNAL_PREFIX = "/_frsh";
export const BUILD_ID = Deno.env.get("DENO_DEPLOYMENT_ID") ||
  crypto.randomUUID();
export const JS_PREFIX = `/js`;
