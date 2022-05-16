---
description: |
  Add middleware routes to intercept requests or responses for analytics
  purposes, access control, or anything else.
---

A middleware is defined in a `_middleware.ts` file. It will intercept the
request in order for you to perform custom logic before or after the route
handler. This allows modifying or checking requests and responses. Common
use-cases for this are logging, authentication, and performance monitoring.

Each middleware gets passed a `next` function in the context argument that is
used trigger child handlers. The `ctx` also has a `state` property that can be
used to pass arbituary data to downstream (or upstream) handlers.

```ts
// routes/_middleware.ts
import { MiddlewareHandlerContext } from "../server_deps.ts";

interface State {
  data: string;
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  ctx.state.data = "myData";
  const resp = await ctx.next();
  resp.headers.set("server", "fresh server");
  return resp;
}
```

```ts
// routes/myHandler.ts
export const handler: Handlers<any, { data: string }> = {
  GET(_req, ctx) {
    return new Response(`middleware data is ${ctx.state.data}`);
  },
};
```

Middlewares are scoped and can be layered. This means a project can have
multiple middlewares, each covering a different set of routes. If multiple
middlewares cover a route, they will all be run, in order of specificity (least
specific first).

For example, take a project with the following routes:

- `routes/_middlware.ts`
- `routes/index.ts`
- `routes/admin/_middleware.ts`
- `routes/admin/index.ts`
- `routes/admin/signin.ts`

For a request to `/` the request will flow like this:

1. The `routes/_middlware.ts` middlware is invoked.
2. Calling `ctx.next()` will invoke the `routes/index.ts` handler.

For a request to `/admin` the request flow like this:

1. The `routes/_middlware.ts` middlware is invoked.
2. Calling `ctx.next()` will invoke the `routes/admin/_middleware.ts` middlware.
3. Calling `ctx.next()` will invoke the `routes/admin/index.ts` handler.

For a request to `/admin/signin` the request flow like this:

1. The `routes/_middlware.ts` middlware is invoked.
2. Calling `ctx.next()` will invoke the `routes/admin/_middleware.ts` middlware.
3. Calling `ctx.next()` will invoke the `routes/admin/signin.ts` handler.
