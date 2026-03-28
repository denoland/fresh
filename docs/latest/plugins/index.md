---
description: "Extend fresh with plugins"
---

Fresh itself can be extended through the methods available on the
[`App`](/docs/concepts/app) class or on the `Builder` class. Most of the
features in Fresh itself are built using these APIs.

## Custom middlewares

If you need to modify requests, add HTTP headers or pass additional data to
other middlewares via `ctx.state`, then going with a middleware is the way to
go.

```ts middleware/fresh.ts
const addXFreshHeader = define.middleware(async (ctx) => {
  const res = await ctx.next();
  res.headers.set("X-Fresh", "served by Fresh");
  return res;
});
```

Learn more about [middlewares](/docs/concepts/middleware).

## Built-in plugins

Fresh ships with the following plugins:

- [cors()](/docs/plugins/cors) - Set CORS HTTP headers
- [csrf()](/docs/plugins/csrf) - CSRF protection
- [csp()](/docs/plugins/csp) - Content Security Policy headers
- [trailingSlashes()](/docs/plugins/trailing-slashes) - Enforce trailing slash
  behavior
