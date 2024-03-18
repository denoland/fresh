```ts
// kvplugin.ts
import { Plugin } from "...";

export const denoKvPlugin: Plugin<{ KV: Deno.Kv }> = {
  name: "kv_plugin",
  // and so on
};
```

And then:

```ts
// myfresh.ts

import app from "...";
import { denoKvPlugin } from "./kvplugin.ts";

const { defineRoute, defineLayout, ...andSoOn } = app.use(denoKvPlugin);
```

And then using those instead of the "regular" defineRoute:

```ts
import { defineRoute } from "./myfresh.ts";

export default defineRoute(async (ctx) => {
  await ctx.env.KV.put(["lol"], "yeah");
});
```

Also you could have subrouters that have, let's say, a database connection
defined.

But other routes that don't.

So it could be something like
`const { defineRoute, defineLayout, MyFresh } = Fresh.with(denoKvPlugin);`

and then you could use `const { defineRoute } = MyFresh.with(somethingElse)` to
further customize it.
