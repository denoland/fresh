import { register } from "jsr:@deno/otel";

if (Deno.telemetry) register();
