> TODO(lucacasonato): this page still needs to be written

A middleware is defined in a `_middleware.ts` file. It will intercept the
request in order for you to perform custom logic. A middleware has a `handle`
function to trigger child handlers. This function can be passed an options
argument that is then available in the child handler as the `state` property.

```ts
// routes/_middleware.ts
import { MiddlewareHandlerContext } from "../server_deps.ts";

export async function handler(req: Request, ctx: MiddlewareHandlerContext) {
  const data = 'myData'
  // ** Pass data to handler 
  const resp = await ctx.handle({ data });
  resp.headers.set('server','fresh server')  
  return resp;
```

```ts
// routes/myHandler.ts
export const handler: Handlers<any, { data: string }> = {
  GET(_req, ctx) {
    return new Response(`middleware data is ${ctx.state.data}`);
  },
};
```

The middlewares are scoped and layered. So for example if there is both a
`routes/_middleware.ts` and a `routes/admin/_middleware.ts`, then a request to
`/admin/foobar` would first go to `routes/_middleware.ts`, then through
`routes/admin/_middleware.ts`, before finally being handled by a
`routes/admin/[name].tsx` handler.

Even if an argument is not passed to the `ctx.handle()` function, the state from
the upper layer middleware will be passed down to the lower layer middleware.
