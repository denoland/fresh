---
description: |
  Configure the Fresh Vite plugin, add other Vite plugins, and understand how Fresh integrates with Vite.
---

Fresh 2 uses [Vite](https://vite.dev/) for development and production builds.
The Fresh Vite plugin handles JSX configuration, Hot Module Replacement (HMR),
[island](/docs/concepts/islands) discovery, client/server code splitting, and
React-to-Preact aliasing.

## Configuration

The Fresh Vite plugin can be configured in `vite.config.ts`:

```ts vite.config.ts
import { defineConfig } from "vite";
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
      // Static file directory or directories. Default: "static"
      // When multiple directories are given, they are searched in
      // order and the first match wins.
      staticDir: ["static", "generated"],
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

## Adding other Vite plugins

You can use any Vite-compatible plugin alongside Fresh. The Fresh plugin should
generally come first:

```ts vite.config.ts
import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    fresh(),
    tailwindcss(),
    // Add any other Vite plugins here
  ],
});
```

## What the plugin does

Behind the scenes, the Fresh Vite plugin:

- **Configures JSX** for Preact automatically (`jsxImportSource: "preact"`)
- **Aliases React to Preact** so npm packages that depend on React work out of
  the box
- **Enables HMR** via [Prefresh](https://github.com/preactjs/prefresh) for fast
  component reloading during development
- **Discovers islands** by scanning the islands directory and any
  `islandSpecifiers`
- **Builds separate client and server bundles** using Vite's Environments
  feature
- **Generates a server entry** (`_fresh/server.js`) for production deployment
- **Validates imports** to catch mistakes like importing Node.js-only modules in
  browser code

## Hot Module Replacement

During development (`deno task dev`), the Fresh Vite plugin enables HMR so that
changes to components, islands, and CSS are reflected in the browser instantly
without a full page reload. This is powered by Prefresh, Preact's fast refresh
implementation.

## Debugging

To debug Vite resolution issues, run Vite with the `--debug` flag:

```sh Terminal
deno run -A npm:vite --debug
```

To inspect plugin transformations, use
[`vite-plugin-inspect`](https://github.com/antfu-collective/vite-plugin-inspect):

```ts vite.config.ts
import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import inspect from "vite-plugin-inspect";

export default defineConfig({
  plugins: [
    fresh(),
    inspect(), // Opens a UI at /__inspect to view all transformations
  ],
});
```
