---
description: "Deploy Fresh on Cloudflare Workers"
---

Deploy Fresh to Cloudflare Workers by following these instructions:

1. Run `deno install --allow-scripts npm:@cloudflare/vite-plugin npm:wrangler`
2. Add the cloudflare plugin in your vite configuration file:

```diff vite.config.ts
  import { defineConfig } from "vite";
  import { fresh } from "@fresh/plugin-vite";
+ import { cloudflare } from "@cloudflare/vite-plugin";

  export default defineConfig({
    plugins: [
      fresh(),
+     cloudflare(),
    ],
  });
```

3. Follow further instructions provided by the cloudflare vite plugin.

Check out the
[Cloudflare Documentation](https://developers.cloudflare.com/workers/vite-plugin/)
for further information.

> [info]: Make sure that you set the the correct entrypoint in your
> `wrangler.jsonc` file. It should point to `"main": "./_fresh/server.js"`
