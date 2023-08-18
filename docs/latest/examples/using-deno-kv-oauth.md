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

5. Start your project with the necessary environment variables.

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
