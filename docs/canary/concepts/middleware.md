---
description: |
  Add middleware routes to intercept requests or responses for analytics purposes, access control, or anything else.
---

A middleware is a function that receives a [`Context`](/docs/canary/context)
object with the
[`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) and
returns a
[`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response). They
are typically used to set HTTP Headers, measure response times or fetch data and
pass it to another middleware.

```tsx
const app = new App<{ greeting: string }>()
  .use((ctx) => {
    // Middleware to pass data
    ctx.state.greeting = "Hello world";
    return ctx.next();
  })
  .use(async (ctx) => {
    // Middleware to add a HTTP header
    const res = await ctx.next();
    res.headers.set("server", "fresh server");
    return res;
  })
  // A handler is a form of middleware that responds. Here we
  // render HTML and return it.
  .get("/", (ctx) => {
    return ctx.render(<h1>{ctx.state.greeting}</h1>);
  });
```

Middlewares can be chained and combined in whatever way you desire. They are an
excellent way to make http-related logic reusable on the server.

## Middleware helper

Use the `define.middleware()` helper to get typings out of the box:

```ts
import { define } from "./utils.ts";

const middleware = define.middleware(async (ctx) => {
  console.log("my middleware");
  return await ctx.next();
});
```

## Included middlewares

Fresh ships with the following middlewares built-in:

- [cors()](/docs/canary/plugins/cors) - Set CORS HTTP headers
- [trailingSlash()](/docs/canary/plugins/trailing-slashes) - Enforce trailing
  slashes

## Filesystem-based middlewares

With file system based routing you can define a middleware in a `_middleware.ts`
file inside the `routes/` folder or any of it's subfolders.

```ts routes/foo/_middleware.ts
import { define } from "./utils.ts";

export default define.middleware(async (ctx) => {
  console.log("my middleware");
  return await ctx.next();
});
```

You can also export an array of middlewares:

```ts routes/foo/_middleware.ts
import { define } from "./utils.ts";

const middleware1 = define.middleware(async (ctx) => {
  console.log("A");
  return await ctx.next();
});

const middleware1 = define.middleware(async (ctx) => {
  console.log("B");
  return await ctx.next();
});

export default [middleware1, middleware2];
```
