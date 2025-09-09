---
description: |
  Configure the fresh vite plugin.
---

The Fresh vite plugin can be optionally configured in the following ways:

```ts vite.config.ts
import { defineConfig, type Plugin } from "vite";
import { fresh } from "@fresh/plugin-vite";

export default defineConfig({
  plugins: [
    fresh({
      // Path to main server entry file. Default: main.ts
      serverEntry: "./path/to/main.ts",
      // Path to main client entry file. Default: client.ts
      clientEntry: "./path/to/client.ts",
      // Path to islands directory. Default: ./islands
      islandsDir: "./islands",
      // Path to routes directory. Default: ./routes
      routeDir: "./routes",
      // Optional regex to ignore folders when crawling the routes and
      // island directory.
      ignore: [/[\\/]+some-folder[\\/]+/],
      // Additional specifiers to treat as island files. This is used
      // for declaring islands from third party packages.
      islandSpecifiers: ["@example/my-remote-island"],
    }),
  ],
});
```
