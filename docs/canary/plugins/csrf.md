---
description: "Prevent Cross-Site Request Forgery with this middleware"
---

The `csrf()` middleware can be used to add safguard against
[Cross-Site Request Forgery vulnerabilities](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF).
It checks if the user is allowed to load the requested URL based on the values
in the
[`Sec-Fetch-Site`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site)
header and
[`Origin`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin)
header. to HTTP requests. These allow the server to indicate which origins
(domains, scheme or port) other than its own is permitted to load resources
from.

```ts main.ts
const app = new App();

app.use(csrf());

// Specify a single origin
app.use(csrf({ origin: "https://example.com" }));

// Specify multiple origins
app.use(
  csrf({ origin: ["https://example.com", "https://trusted.example.com"] }),
);

// Specify multiple origins
app.use(
  csrf({ origin: ["https://example.com", "https://trusted.example.com"] }),
);

// Use a function
app.use(
  csrf({
    origin: (origin) => /^https:\/\/(foo|bar)\.example\.com$/.test(origin),
  }),
);
```
