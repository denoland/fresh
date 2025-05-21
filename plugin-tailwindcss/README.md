# Tailwind CSS plugin for Fresh

A Tailwind CSS plugin to use in Fresh.

```ts
// dev.ts

import { tailwind } from "@fresh/plugin-tailwind";
import { Builder } from "fresh/dev";
import { app } from "./main.ts";

const devApp = new Builder();

// Enable Tailwind CSS
tailwind(builder, app);

if (Deno.args.includes("build")) {
  await builder.build();
} else {
  await builder.listen();
}
```

To learn more about Fresh go to
[https://fresh.deno.dev/](https://fresh.deno.dev/).
