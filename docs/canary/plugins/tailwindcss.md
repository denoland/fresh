---
description: "Use Tailwindcss to style your app"
---

[Tailwindcss](https://tailwindcss.com/) is a utility-first CSS framework that
generates CSS out of the class names that are used in JSX. Since we use
Tailwindcss ourselves here at Deno, Fresh ships with an official plugin for
that.

## Usage

1. Set `nodeModulesDir` in `deno.json` to `"auto"` or `"manual"`

```diff deno.json
  {
    "name": "@example/my-cool-project"
+   "nodeModulesDir": "auto",
    "imports": {
      ...
    }
  }
```

2. Run `deno install jsr:@fresh/plugin-tailwind`
3. Update `dev.ts`:

```diff dev.ts
  import { Builder } from "fresh/dev";
  import { app } from "./main.ts";
+ import { tailwind } from "@fresh/plugin-tailwind";
  
  const builder = new Builder();
+ tailwind(builder, app);
```

4. Add `@import "tailwindcss";` at the top of your main stylesheet.

For more information on how to use tailwindcss, check out
[their documentation](https://tailwindcss.com/docs/styling-with-utility-classes).

## Options

You can customize the tailwind plugin via the following options:

```ts
tailwind(builder, app, {
  // Exclude certain files from processing
  exclude: ["/admin/**", "*.temp.css"],
  // Force optimization (defaults to production mode)
  optimize: true,
  // Exclude base styles
  base: null,
});
```
