import { generateUuid } from "./deps.ts";

export const INTERNAL_PREFIX = "/_frsh";
export const BUILD_ID = Deno.env.get("DENO_DEPLOYMENT_ID") || generateUuid();
export const JS_PREFIX = `/js`;
