---
description: |
  For when you have some complicated setup that needs to be performed once.
---

Let's pretend you've just initialized a new Fresh project. You want to do some
complicated setup that runs once, before the server is started. This is,
fortunately, quite easy. Here's how:

```diff main.ts
 import { start } from "$fresh/server.ts";
 import manifest from "./fresh.gen.ts";
+import { Context } from "./routes/_middleware.ts";

+await Context.init();
 await start(manifest);
```

So your full `main.ts` should look like this:

```ts main.ts
/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "$std/dotenv/load.ts";

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import { Context } from "./routes/_middleware.ts";

await Context.init();
await start(manifest);
```

But what's going on in this new `_middleware.ts` we've created?

```ts routes/_middleware.ts
import { MiddlewareHandlerContext } from "$fresh/server.ts";

export interface State {
  context: Context;
}

export class Context {
  private static context: Context;
  private complicatedStartupValue: number;

  public constructor() {
    // presumably this involves connecting to a
    // database or doing some heavy computation
    this.complicatedStartupValue = 42;
  }

  public static async init() {
    Context.context = new Context();
  }

  public static instance() {
    if (this.context) return this.context;
    else throw new Error("Context is not initialized!");
  }
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  ctx.state.context = Context.instance();
  const resp = await ctx.next();
  return resp;
}
```

So now in this `handler` (or any other `handler` functions you create) you can
have access to the complicated initialization step by calling
`Context.instance()`.
