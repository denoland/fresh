---
description: |
  Set the lang attribute in the <html> tag.
---

With Fresh you can serve your app in multiple languages, including translated content and locale aware routes. Routing is typically internationalized by either a segment in the url's pathname (`/fr/about`) or a subdomain `my-site.fr/products`.

Whenever possible, adhere to the user's requested language preference. The browser sends this in the form of an `Accept-Language` HTTP header. To detect that we modify our `_app` template.

```tsx
// routes/_app.tsx
export default async function App(
  req: Request,
  ctx: RequestContext,
  { Component }
) {
  //
}
```

When you initialize a project with `deno run -A -r https://fresh.deno.dev`,
you'll end up with a `main.ts` like the following:

```ts { "title": "main.ts" }
/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";

import twindPlugin from "$fresh/plugins/twind.ts";
import twindConfig from "./twind.config.ts";

await start(manifest, { plugins: [twindPlugin(twindConfig)] });
```

This is a great start if your site is in English, but let's say you want to
change the language, as per the `<html lang=asdf>` tag. Then you'll need to do
something like this:

```ts { "title": "main.ts" }
/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";

import twindPlugin from "$fresh/plugins/twind.ts";
import twindConfig from "./twind.config.ts";

await start(manifest, {
  plugins: [twindPlugin(twindConfig)],
  render: (ctx, render) => {
    ctx.lang = "de";
    render();
  },
});
```

If you're curious how this works, start by checking out `TemplateOptions` in
`render.ts`.
