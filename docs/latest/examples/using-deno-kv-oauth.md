---
description: Easily integrate OAuth 2.0 into your Fresh project with the official Deno KV OAuth plugin.
---

> ⚠️ Please note that this functionality relies on
> [Deno KV](https://deno.com/manual/runtime/kv) which is currently marked as
> **experimental** and is **subject to change**. It is only available when using
> the `--unstable` flag.

> ⚠️ Please note that Deno KV OAuth is still in **beta** and is **subject to
> change**. See [the documentation](https://deno.land/x/deno_kv_oauth) for
> further details.

> ⚠️ Please note that the minimum required version for plugins in Fresh is 1.3.0

Fresh comes with an official Deno KV OAuth plugin based on the first-party
[Deno KV OAuth](https://deno.land/x/deno_kv_oauth) module. This plugin creates
and configured your OAuth routes for your project.

## Basic Setup

The most basic setup is that using a single provider with a pre-defined OAuth
configuration. This automatically creates the following routes:

- `GET /oauth/signin`
- `GET /oauth/callback`
- `GET /oauth/signout`

This is implemented as follows:

1. Create your OAuth 2.0 application for your given provider.

2. Create your
   [pre-defined](https://deno.land/x/deno_kv_oauth#pre-defined-oauth-configurations)
   or [custom](https://deno.land/x/deno_kv_oauth#custom-oauth-20-client) OAuth
   configuration and configure Fresh to use the plugin.

   ```ts main.ts
   import { start } from "$fresh/server.ts";
   import {
     createGitHubOAuth2Client,
     createRoutes,
   } from "$fresh/plugins/kv_oauth.ts";
   import manifest from "./fresh.gen.ts";

   await start(manifest, {
     plugins: [
       {
         name: "kv-oauth",
         routes: createRoutes(createGitHubOAuth2Client()),
       },
     ],
   });
   ```

   ```ts routes/protected.ts
   import type { Handlers } from "$fresh/server.ts";
   import { getSessionId } from "$fresh/plugins/kv_oauth.ts";

   export const handler: Handlers = {
     async GET(req) {
       return getSessionId(request) === undefined
         ? new Response("Unauthorized", { status: 401 })
         : new Response("You are allowed");
     },
   };
   ```

3. ⚠️ While Deno KV is still **experimental** you need to add the `--unstable`
   option to the `start` task in the `deno.json` file.

   ```json
   "start": "deno run -A --watch=static/,routes/ --unstable dev.ts",
   ```

4. Start your project with the necessary environment variables.

   ```sh
   GITHUB_CLIENT_ID=xxx GITHUB_CLIENT_SECRET=xxx deno task start
   ```

## Further Setup

The plugin is capable of having multiple providers, custom OAuth configurations
and custom parent OAuth routes. These are implemented similar to the above
example, as follows:

1. Create your OAuth 2.0 application for your given provider.

2. Create your
   [pre-defined](https://deno.land/x/deno_kv_oauth#pre-defined-oauth-configurations)
   or [custom](https://deno.land/x/deno_kv_oauth#custom-oauth-20-client) OAuth
   configuration and configure Fresh to use the plugin.

   ```ts main.ts
   import { start } from "$fresh/server.ts";
   import {
     createNotionOAuthConfig,
     createRoutes,
   } from "$fresh/plugins/kv_oauth.ts";
   import manifest from "./fresh.gen.ts";

   await start(manifest, {
     plugins: [
       {
         name: "kv-oauth",
         routes: [
           ...createRoutes(createNotionOAuthConfig(), "/oauth/notion"),
           ...createRoutes({
             clientId: getRequiredEnv("CUSTOM_CLIENT_ID"),
             clientSecret: getRequiredEnv("CUSTOM_CLIENT_SECRET"),
             authorizationEndpointUri: "https://custom.com/oauth/authorize",
             tokenUri: "https://custom.com/oauth/token",
             redirectUri: "https://my-site.com/oauth/custom/callback",
           }, "/oauth/custom"),
         ],
       },
     ],
   });
   ```

   ```ts routes/protected.ts
   import type { Handlers } from "$fresh/server.ts";
   import { getSessionId } from "$fresh/plugins/kv_oauth.ts";

   export const handler: Handlers = {
     async GET(req) {
       return getSessionId(request) === undefined
         ? new Response("Unauthorized", { status: 401 })
         : new Response("You are allowed");
     },
   };
   ```

3. ⚠️ While Deno KV is still **experimental** you need to add the `--unstable`
   option to the `start` task in the `deno.json` file.

   ```json
   "start": "deno run -A --watch=static/,routes/ --unstable dev.ts",
   ```

4. Start your project with the necessary environment variables.

   ```sh
   NOTION_CLIENT_ID=xxx NOTION_CLIENT_SECRET=xxx CUSTOM_CLIENT_ID=yyy CUSTOM_CLIENT_SECRET=yyy deno task start
   ```

### Advanced Setups

If you require more advanced setups, you can create your own custom plugin that
defines the routes and their behaviors. To do this, check out the following
resources:

- The [source code](plugins/kv_oauth.ts) for the Deno KV OAuth plugin
- The [documentation](https://fresh.deno.dev/docs/concepts/plugins) for plugins
- The
  [Fresh + Deno KV OAuth demo](https://github.com/denoland/fresh-deno-kv-oauth-demo)
  which uses the Fresh plugin
- [Deno SaaSKit](https://saaskit.deno.dev/)'s custom
  [plugin implementation](https://github.com/denoland/saaskit/blob/3accffdc44c2d2eb6dba28126f8d4cb525eba340/plugins/kv_oauth.ts)
  as an example
