---
description: |
  Building your Fresh app for production.
---

Fresh comes with built-in capabilities to compress assets to improve page load
speed.

## Building

You can build your Fresh app by invoking the `deno task build` script. This will
run the `dev.ts` file, which will then call Fresh's `Builder` class and generate
optimized bundles for the browser. Put any additional tasks that should be done
to prepare your app for deployment here. You can check if the build task was
invoke by checking for `Deno.args.includes("build")`.

Here is an example what the `dev.ts` file looks like for the Fresh documentation
website:

```ts dev.ts
import { Builder } from "fresh/dev";
import { app } from "./main.ts";
import { tailwind } from "@fresh/plugin-tailwind";

const builder = new Builder({ target: "safari12" });
tailwind(builder, app, {});

if (Deno.args.includes("build")) {
  await builder.build(app);
} else {
  await builder.listen(app);
}
```

## Preview your app

You can preview your production app locally by running the `deno task start` or
running `deno run -A main.ts` directly.
