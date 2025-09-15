---
description: "Set Content-Security-Policy (CSP) HTTP headers with the csp middleware"
---

The `csp()` middleware can be used to add
[Content-Security-Policy headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
to HTTP requests. These restrict which resources a document is allowed to load.

```ts main.ts
import { csp } from "fresh";

const app = new App()
  .use(csp({
    // If true, sets Content-Security-Policy-Report-Only header instead
    // of Content-Security-Policy
    reportOnly: true,
    // If set, adds Reporting-Endpoints, report-to, and report-uri
    // directive.
    reportTo: "/api/csp-reports",
    // Additional CSP directives to add or override the defaults
    csp: [
      "script-src 'self' 'unsafe-inline' 'https://example.com'",
    ],
  }))
  .get("/", () => new Response("hello"));
```

## Options

See the [API docs](https://jsr.io/@fresh/core/doc/~/csp) for a list of all
supported options.
