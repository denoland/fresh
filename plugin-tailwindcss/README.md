# Tailwind CSS plugin for Fresh

A Tailwind CSS plugin to use in Fresh.

```ts
// dev.ts

import { tailwind } from "@fresh/plugin-tailwind";
import { FreshDevApp } from "fresh/dev";
import { app } from "./main.ts";

const devApp = new FreshDevApp();

// Enable Tailwind CSS
tailwind(devApp);

devApp.mountApp("/", app);

if (Deno.args.includes("build")) {
  await devApp.build({
    target: "safari12",
  });
} else {
  await devApp.listen();
}
```

To learn more about Fresh go to
[https://fresh.deno.dev/](https://fresh.deno.dev/).
