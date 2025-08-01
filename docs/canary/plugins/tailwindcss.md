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
+ import { tailwind } from "@fresh/plugin-tailwind";
  
  const builder = new Builder();
+ tailwind(builder);
```

4. Add `@import "tailwindcss";` at the top of your main stylesheet.

For more information on how to use tailwindcss, check out
[their documentation](https://tailwindcss.com/docs/styling-with-utility-classes).

## Options

You can customize the tailwind plugin via the following options:

```ts dev.ts
tailwind(builder, app, {
  // Exclude certain files from processing
  exclude: ["/admin/**", "*.temp.css"],
  // Force optimization (defaults to production mode)
  optimize: true,
  // Exclude base styles
  base: null,
});
```

## Tailwindcss v3

If can't update to the current version of tailwindcss we have a dedicated
`@fresh/plugin-tailwindcss-v3` plugin that uses tailwindcss v3. That way you can
decided on your own when it's best to update to v4.

```ts dev.ts
import { Builder } from "fresh/dev";
import { tailwind } from "@fresh/plugin-tailwindcss-v3";

tailwind(builder, {});
```
