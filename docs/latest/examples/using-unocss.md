---
description: |
  One can use UnoCSS, an instant on-demand atomic CSS engine
---

The template generates a Twind v0 project by default. If you want to use UnoCSS
you can update the `main.ts` as follows:

```ts
/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";

import unocssPlugin from "$fresh/plugins/unocss.ts";
import unocssConfig from "./uno.config.ts";

await start(manifest, { plugins: [unocssPlugin(unocssConfig)] });
```

The unocss config object at `uno.config.ts` can be customized to your liking.
Refer to the [unocss docs](https://unocss.dev/guide/config-file) for more
information. If no config is provided, the default config is used, which
defaults to the following:

```ts
import type { UserConfig } from "https://esm.sh/@unocss/core@0.55.1";
import presetUno from "https://esm.sh/@unocss/preset-uno@0.55.1";

export default {
  presets: [presetUno()],
} satisfies UserConfig;
```

Note: you could also inline the config object in `main.ts` instead of using a
separate `uno.config.ts` file.

To see what other presets exist, you can go to the
[unocss docs](https://unocss.dev/presets/).
