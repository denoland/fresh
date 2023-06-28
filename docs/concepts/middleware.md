---
description: |
  Add middleware routes to intercept requests or responses for analytics purposes, access control, or anything else.
---

A middleware is defined in a `_middleware.ts` file. It will intercept the
request in order for you to perform custom logic before or after the route
handler. This allows modifying or checking requests and responses. Common
use-cases for this are logging, authentication, and performance monitoring.

Each middleware gets passed a `next` function in the context argument that is
used to trigger child handlers. The `ctx` also has a `state` property that can
be used to pass arbitrary data to downstream (or upstream) handlers. This
`state` is included in `PageProps` by default, which is available to both the
special [_app](/docs/concepts/app-wrapper.md) wrapper and normal
[routes](/docs/concepts/routes.md).

```ts
// routes/_middleware.ts
import { MiddlewareHandlerContext } from "$fresh/server.ts";

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
export const handler: MultiHandler<any, { data: string }> = {
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

- `routes/_middleware.ts`
- `routes/index.ts`
- `routes/admin/_middleware.ts`
- `routes/admin/index.ts`
- `routes/admin/signin.ts`

For a request to `/` the request will flow like this:

1. The `routes/_middleware.ts` middleware is invoked.
2. Calling `ctx.next()` will invoke the `routes/index.ts` handler.

For a request to `/admin` the request flows like this:

1. The `routes/_middleware.ts` middleware is invoked.
2. Calling `ctx.next()` will invoke the `routes/admin/_middleware.ts`
   middleware.
3. Calling `ctx.next()` will invoke the `routes/admin/index.ts` handler.

For a request to `/admin/signin` the request flows like this:

1. The `routes/_middleware.ts` middleware is invoked.
2. Calling `ctx.next()` will invoke the `routes/admin/_middleware.ts`
   middleware.
3. Calling `ctx.next()` will invoke the `routes/admin/signin.ts` handler.

A single middleware file can also define multiple middlewares (all for the same
route) by exporting an array of handlers instead of a single handler. For
example:

```ts
// routes/_middleware.ts

export const handler = [
  async function middleware1(req, ctx) {
    // do something
    return ctx.next();
  },
  async function middleware2(req, ctx) {
    // do something
    return ctx.next();
  },
];
```

## Middleware Destination

To set the stage for this section, `MiddlewareHandlerContext` looks like this:

```ts
export interface MiddlewareHandlerContext<State = Record<string, unknown>>
  extends ConnInfo {
  next: () => Promise<Response>;
  state: State;
  destination: router.DestinationKind;
}
```

and `router.DestinationKind` is defined like this:

```ts
export type DestinationKind = "internal" | "static" | "route" | "notFound";
```

This is useful for if you want your middleware to only run when a request is
headed for a `route`, as opposed to something like
`http://localhost:8001/favicon.ico`.

### Example

Initiate a new Fresh project (`deno run -A -r https://fresh.deno.dev/`) and then
create a `_middleware.ts` file in the `routes` folder like this:

```ts
import { MiddlewareHandlerContext } from "$fresh/server.ts";

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext,
) {
  console.log(ctx.destination);
  console.log(req.url);
  const resp = await ctx.next();
  return resp;
}
```

If you start up your server (`deno task start`) you'll see the following:

```
Task start deno run -A --watch=static/,routes/ dev.ts
Watcher Process started.
The manifest has been generated for 4 routes and 1 islands.

 🍋 Fresh ready
    Local: http://localhost:8000/

route
http://localhost:8000/
internal
http://localhost:8000/_frsh/js/3c7400558fc00915df88cb181036c0dbf73ab7f5/deserializer.js
internal
http://localhost:8000/_frsh/js/3c7400558fc00915df88cb181036c0dbf73ab7f5/signals.js
internal
http://localhost:8000/_frsh/js/3c7400558fc00915df88cb181036c0dbf73ab7f5/plugin-twind-main.js
internal
http://localhost:8000/_frsh/js/3c7400558fc00915df88cb181036c0dbf73ab7f5/main.js
internal
http://localhost:8000/_frsh/js/3c7400558fc00915df88cb181036c0dbf73ab7f5/island-counter.js
internal
http://localhost:8000/_frsh/refresh.js
static
http://localhost:8000/logo.svg?__frsh_c=3c7400558fc00915df88cb181036c0dbf73ab7f5
internal
http://localhost:8000/_frsh/alive
internal
http://localhost:8000/_frsh/js/3c7400558fc00915df88cb181036c0dbf73ab7f5/chunk-PDMKJVJ5.js
internal
http://localhost:8000/_frsh/js/3c7400558fc00915df88cb181036c0dbf73ab7f5/chunk-UGFDDSOV.js
internal
http://localhost:8000/_frsh/js/3c7400558fc00915df88cb181036c0dbf73ab7f5/chunk-RCK7U3UF.js
```

That first `route` request is for when `Fresh` responds with the root level
`index.tsx` route. The rest, as you can see, are either `internal` or `static`
requests. You can use `ctx.destination` to filter these out if your middleware
is only supposed to deal with routes.
