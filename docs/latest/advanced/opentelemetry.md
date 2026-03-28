---
description: |
  Fresh has built-in OpenTelemetry instrumentation for tracing requests through middleware, handlers, and rendering.
---

Fresh automatically instruments key operations with
[OpenTelemetry](https://opentelemetry.io/) spans, giving you visibility into how
requests flow through your application.

## What's instrumented

Fresh creates spans for:

- **Middleware execution** — each middleware in the chain
- **Route handler execution** — handler function calls
- **Rendering** — server-side page rendering
- **Static file serving** — file lookups and responses
- **Lazy route loading** — dynamic imports of route modules

## Enabling tracing

Fresh uses the `@opentelemetry/api` package (the vendor-neutral API). Spans are
created automatically — you just need to provide an OpenTelemetry SDK and
exporter to collect them.

If no exporter is configured, the spans are silently discarded (no performance
overhead).

### With Deno's built-in OpenTelemetry

Deno has
[built-in OpenTelemetry support](https://docs.deno.com/runtime/fundamentals/open_telemetry/).
Enable it with the `OTEL_DENO` environment variable:

```sh Terminal
OTEL_DENO=true deno task start
```

This exports traces to an OTLP-compatible collector (configure the endpoint with
`OTEL_EXPORTER_OTLP_ENDPOINT`).

### With Deno Deploy

[Deno Deploy](https://deno.com/deploy) collects Fresh traces automatically when
using the Fresh preset — no configuration needed.
