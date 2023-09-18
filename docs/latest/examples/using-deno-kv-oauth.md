---
description: Easily integrate OAuth 2.0 to your Fresh project with Deno KV OAuth.
---

> ⚠️ Please note that this functionality relies on
> [Deno KV](https://deno.com/manual/runtime/kv) which is currently marked as
> **experimental** and is **subject to change**. It is only available when using
> the `--unstable` flag.

> ⚠️ Please note that Deno KV OAuth is still in **beta** and is **subject to
> change**. See [the documentation](https://deno.land/x/deno_kv_oauth) for
> further details.

## Getting Started with the Official Fresh Plugin

> Note: The minimum required version for plugins in Fresh is 1.3.0

If you're not performing anything special in the sign-in, sign-out and callback
handlers, you can add the Fresh plugin to your project. This automatically
handles `GET /oauth/signin`, `GET /oauth/callback` and `GET /oauth/signout`
routes.

1. Create your OAuth 2.0 application for your given provider.

2. Create your
   [pre-configured](https://deno.land/x/deno_kv_oauth#pre-configured-oauth-20-clients)
   or
   [custom OAuth 2.0 client instance](https://deno.land/x/deno_kv_oauth#custom-oauth-20-client)
   and configure Fresh to use the plugin.

   ```ts
   // main.ts
   import { start } from "$fresh/server.ts";
   import kvOAuthPlugin from "$fresh/plugins/kv_oauth.ts";
   import { createGitHubOAuth2Client } from "https://deno.land/x/deno_kv_oauth@$VERSION/mod.ts";
   import manifest from "./fresh.gen.ts";

   await start(manifest, {
     plugins: [
       kvOAuthPlugin(createGitHubOAuth2Client()),
     ],
   });
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

If you require more advanced setups, you can create your own plugin. For more
information, see:

- The [source code](src/fresh_plugin.ts) for `kvOAuthPlugin()`
- The [Plugin documentation](https://fresh.deno.dev/docs/concepts/plugins) for
  Fresh
- The
  [Fresh + Deno KV OAuth demo](https://github.com/denoland/fresh-deno-kv-oauth-demo)
  which uses the Fresh plugin
- [Deno SaaSKit](https://saaskit.deno.dev/)'s custom
  [plugin implementation](https://github.com/denoland/saaskit/blob/3accffdc44c2d2eb6dba28126f8d4cb525eba340/plugins/kv_oauth.ts)

## Getting Started

This example uses GitHub as the OAuth 2.0 provider. However there is a suite of
[pre-configured providers](https://deno.land/x/deno_kv_oauth#pre-configured-oauth-20-clients)
available.

1. Register a [new GitHub OAuth](https://github.com/settings/applications/new)
   application, if you haven't already.
2. Create your pre-configured OAuth client instance. For reusability the
   instance is stored in `utils/oauth2_client.ts`.

   ```ts utils/oauth2_client.ts
   import { createGitHubOAuth2Client } from "https://deno.land/x/deno_kv_oauth@v0.2.4/mod.ts";

   export const oauth2Client = createGitHubOAuth2Client();
   ```

3. Using the OAuth 2.0 client instance, insert the authentication flow functions
   into your authentication routes. In this example, there are dedicated handler
   routes at `routes/signin.ts`, `routes/signout.ts` and `routes/callback.ts`.
   Please ensure that the `callback` handler matches the authorization callback
   URL in the configured OAuth application.

   ```ts routes/signin.ts
   import { Handlers } from "$fresh/server.ts";
   import { signIn } from "https://deno.land/x/deno_kv_oauth@v0.2.4/mod.ts";
   import { oauth2Client } from "../utils/oauth2_client.ts";

   export const handler: Handlers = {
     async GET(req) {
       return await signIn(req, oauth2Client);
     },
   };
   ```

   ```ts routes/signout.ts
   import { Handlers } from "$fresh/server.ts";
   import { signOut } from "https://deno.land/x/deno_kv_oauth@v0.2.4/mod.ts";

   export const handler: Handlers = {
     async GET(req) {
       return await signOut(req);
     },
   };
   ```

   ```ts routes/callback.ts
   import { Handlers } from "$fresh/server.ts";
   import { handleCallback } from "https://deno.land/x/deno_kv_oauth@v0.2.4/mod.ts";
   import { oauth2Client } from "../utils/oauth2_client.ts";

   export const handler: Handlers = {
     async GET(req) {
       // Return object also includes `accessToken` and `sessionId` properties.
       const { response } = await handleCallback(req, oauth2Client);
       return response;
     },
   };
   ```

4. Use Deno KV OAuth's helper functions where needed.

   ```tsx routes/index.tsx
   import { Handlers, PageProps } from "$fresh/server.ts";
   import {
     getSessionAccessToken,
     getSessionId,
   } from "https://deno.land/x/deno_kv_oauth@v0.2.4/mod.ts";
   import { oauth2Client } from "../utils/oauth2_client.ts";

   interface User {
     login: string;
     name: string;
     avatar_url: string;
   }

   export const handler: Handlers<User | null> = {
     async GET(req, ctx) {
       const sessionId = await getSessionId(req);

       if (!sessionId) {
         return ctx.render(null);
       }

       const accessToken = await getSessionAccessToken(oauth2Client, sessionId);
       const response = await fetch("https://api.github.com/user", {
         headers: {
           authorization: `bearer ${accessToken}`,
         },
       });
       const user: User = await response.json();
       return ctx.render(user);
     },
   };

   export default function Page({ data }: PageProps<User | null>) {
     if (!data) {
       return <a href="/signin">Sign In</a>;
     }

     return (
       <div>
         <img src={data.avatar_url} width={64} height={64} />
         <h1>{data.name}</h1>
         <p>{data.login}</p>
         <a href="/signout">Sign Out</a>
       </div>
     );
   }
   ```

5. ⚠️ While Deno KV is still **experimental** you need to add the `--unstable`
   option to the `start` task in the `deno.json` file.

   ```json
   "start": "deno run -A --watch=static/,routes/ --unstable dev.ts",
   ```

6. Start your project with the necessary environment variables.

   ```sh
   GITHUB_CLIENT_ID=xxx GITHUB_CLIENT_SECRET=xxx deno task start
   ```

## More on Deno KV OAuth

Follow the links to read more about:

- Using a provider from the list of
  [pre-configured providers](https://deno.land/x/deno_kv_oauth#pre-configured-oauth-20-clients)
- Configuring a
  [custom OAuth 2.0 client](https://deno.land/x/deno_kv_oauth#custom-oauth-20-client)
- Setting the mandatory
  [environment variables](https://deno.land/x/deno_kv_oauth#environment-variables)
- Exploring a [live demo](https://fresh-deno-kv-oauth-demo.deno.dev/)
