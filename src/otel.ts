import { trace } from "@opentelemetry/api";
import denoJson from "../deno.json" with { type: "json" };

export const CURRENT_FRESH_VERSION = denoJson.version;

export const tracer = trace.getTracer("fresh", CURRENT_FRESH_VERSION);
export { trace };
