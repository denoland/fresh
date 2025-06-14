import { register } from "@deno/otel";

if (Deno.telemetry) register();
