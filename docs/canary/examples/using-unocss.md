---
description: |
  One can use UnoCSS, an instant on-demand atomic CSS engine
---

The template generates a Twind v0 project by default. If you want to use UnoCSS,
update the `main.ts` as follows:

```ts
/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";

import unocssPlugin from "$fresh/plugins/unocss.ts";

await start(manifest, { plugins: [unocssPlugin()] });
```

Your project folder should contain a `uno.config.ts` file, which can be
customized to your liking. Refer to the
[unocss docs](https://unocss.dev/guide/config-file) for more information.

The behaviour of the plugin may be customised by passing it an argument. The
argument is an options object, which may contain any of the following options:

- `aot` (`boolean`): Enable AOT mode - run UnoCSS to extract styles during the
  build task. Default: `true`.
- `ssr` (`boolean`): Enable SSR mode - run UnoCSS live to extract styles during
  server renders. Default: `false`.
- `csr` (`boolean`): Enable CSR mode - run the UnoCSS runtime on the client. It
  will generate styles live in response to DOM events. Default: `false`.
- `config`: An inline UnoCSS `UserConfig` object, as an alternative to a
  `uno.config.ts` file. Note that this is not compatible with the `csr` option,
  as the config object can not be bundled and sent to the client.
