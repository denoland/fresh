---
description: |
  Using Tailwind CSS in Fresh
---

Add Tailwind CSS to your project by importing the
[Fresh Tailwind plugin](https://deno.land/x/fresh_tailwind) in your
`fresh.config.ts` file.

```ts fresh.config.ts
import tailwindPlugin from "https://deno.land/x/fresh_tailwind/mod.ts";

export default defineConfig({
  plugins: [
    tailwindPlugin(),
  ],
});
```

This is all that is required to add Tailwind styles. The plugin will compile
Tailwind with every request if no plugin configuration is provided. This is
useful for a quick development setup, but might not be necessary in a production
environment.

Provide the CSS source, or path to the source file, in the plugin's `css`
option.

```ts fresh.config.ts
export default defineConfig({
  plugins: [
    tailwindPlugin({
      css: "./src/style.css",
    }),
  ],
});
```

The `dest` option can be specified to save output to a CSS file during
[ahead-of-time builds](../concepts/ahead-of-time-builds.md).

```ts fresh.config.ts
export default defineConfig({
  plugins: [
    tailwindPlugin({
      css: "./src/style.css",
      dest: "./static/style.css",
    }),
  ],
});
```

Run `deno task build` to create the `dest` output file.

The plugin will include your Tailwind CSS output in Fresh automatically! You can
remove the `<link />` to the default stylesheet in your HTML `<head>`:

```diff
  // routes/_app.tsx
  <head>
-   <link rel="stylesheet" href="/styles.css" />
  </head>
```

## Tailwind Plugins

The Fresh plugin will attempt to find your Tailwind configuration file during
compilation. (You can also specify the file path in the Fresh plugin's
`configFile` option.)

```ts fresh.config.ts
export default defineConfig({
  plugins: [
    tailwindPlugin({
      css: "./src/style.css",
      dest: "./static/style.css",
      // (Optional. The plugin will attempt to load from tailwind.config.ts, .js, and .mjs)
      configFile: "./tailwind.config.ts",
    }),
  ],
});
```

```ts tailwind.config.ts
import animate from "https://esm.sh/tailwindcss-animate@1.0.7";

export default {
  content: [
    "./routes/**/*.{ts,tsx}",
    "./islands/**/*.tsx",
    "./components/**/*.tsx",
  ],
  theme: {
    extend: {
      colors: {
        fresh: "#86efac",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [
    animate,
  ],
};
```

The Tailwind configuration file will be used in the Deno runtime. If you are
using the Tailwind IntelliSense extension in VS Code, you will need to have a
`tailwind.config.ts` file which can be interpreted by the _extension's_ Vite
server.
[More details are available in the module's documentation](https://deno.land/x/fresh_tailwind#using-intellisense).

## PostCSS Plugins

Provide an [`AcceptedPlugin`](https://deno.land/x/fresh_tailwind/deps.ts?source)
array in the `plugins` option to use PostCSS plugins during compilation.

```ts fresh.config.ts
import autoprefixer from "https://esm.sh/autoprefixer";
import cssnano from "npm:cssnano";

export default defineConfig({
  plugins: [
    tailwindPlugin({
      css: "./src/style.css",
      dest: "./static/style.css",
      plugins: [
        autoprefixer(),
        cssnano({
          preset: "default",
        }),
      ],
    }),
  ],
});
```

> Note: Tailwind CSS is the only PostCSS plugin used by default.

# Multiple Plugin Instances

More than one instance of the Tailwind plugin can be used in
`defineConfig.plugins`. This can be especially useful if just-in-time
compilation is required in production.

```ts fresh.config.ts
export default defineConfig({
  plugins: [
    // AOT
    tailwindPlugin({
      css: "./src/style.css",
      dest: "./static/style.css",
    }),
    // JIT
    tailwindPlugin({
      css: "./src/partials.css",
    }),
  ],
});
```

Multiple instances can also be used to create theme variations. For example:

```ts fresh.config.ts
// Using different source files:
const plugins = ["cool", "warm"].map((theme) => {
  return tailwindPlugin({
    css: `./src/${theme}.css`,
    dest: `./static/${theme}.css`,
  });
});

// OR - Using different configuration files:
const plugins = ["dark", "light"].map((theme) => {
  return tailwindPlugin({
    css: "./src/common.css",
    dest: `./static/${theme}.css`,
    configFile: `./tailwind_${theme}.config.ts`,
  });
});

export default defineConfig({
  plugins,
});
```
