# Tailwind CSS plugin for Fresh

A Tailwind CSS plugin to use in Fresh.

> **Note:** This plugin **only** supports Tailwind CSS v4

```ts
// dev.ts

import { Builder } from "fresh/dev";
import { app } from "./main.ts";
import { tailwind } from "@fresh/plugin-tailwind";

const builder = new Builder({ target: "safari12" });
// Enable Tailwind CSS
tailwind(builder, app);

if (Deno.args.includes("build")) {
  await builder.build(app);
} else {
  await builder.listen(app);
}
```

To learn more about Fresh go to
[https://fresh.deno.dev/](https://fresh.deno.dev/).
