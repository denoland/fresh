export { FRESH_VERSION, PREACT_VERSION } from "../../update/src/update.ts";

// Read plugin-tailwindcss version from its deno.json
// This is safe as @fresh/test-utils is internal to the monorepo.
import twDenoJson from "../../plugin-tailwindcss/deno.json" with { type: "json" };
export const TAILWIND_PLUGIN_VERSION: string = String(twDenoJson.version);
