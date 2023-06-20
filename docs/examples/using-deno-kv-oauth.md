---
description: Easily integrate OAuth 2.0 to your Fresh project with Deno KV OAuth.
---

> ⚠️ Please note that this functionality relies on
> [Deno KV](https://deno.com/manual/runtime/kv) which is currently marked as
> **experimental** and is **subject to change**. It is only available when using
> the `--unstable` flag.

## Using a pre-configured OAuth 2.0 provider

This example uses GitHub as the OAuth 2.0 provider. However there is a suite of
[pre-configured providers](https://deno.land/x/deno_kv_oauth#pre-configured-oauth-20-clients)
available.

1. Register a [new GitHub OAuth](https://github.com/settings/applications/new)
   application, if you haven't already.
2. Create your pre-configured OAuth client instance. For reusability the
   instance is stored in `utils/oauth-client.ts`.

```typescript
// utils/oauth-client.ts
import { createGitHubOAuth2Client } from "https://deno.land/x/deno_kv_oauth/mod.ts";

export const oauth2Client = createGitHubOAuth2Client();
```

3. Using the OAuth 2.0 client instance, insert the authentication flow functions
   into your authentication routes. In this example, there are dedicated handler
   routes at `routes/auth/signin.ts`, `routes/auth/signout.ts` and
   `routes/auth/callback.ts`. Please ensure that the `callback` handler matches
   the Authorization callback URL in the configured OAuth application!

```typescript
// routes/auth/signin.ts
import type { Handlers } from "$fresh/server.ts";
import { signIn } from "https://deno.land/x/deno_kv_oauth/mod.ts";
import { oauth2Client } from "../../utils/oauth-client.ts";

export const handler: Handlers = {
  async GET(req) {
    return await signIn(req, oauth2Client);
  },
};
```

```typescript
// routes/auth/signout.ts
import type { Handlers } from "$fresh/server.ts";
import { signOut } from "https://deno.land/x/deno_kv_oauth/mod.ts";

export const handler: Handlers = {
  async GET(req) {
    return await signOut(req, "/");
  },
};
```

```typescript
// routes/auth/callback.ts
import type { Handlers } from "$fresh/server.ts";
import { handleCallback } from "https://deno.land/x/deno_kv_oauth/mod.ts";
import { oauth2Client } from "../../utils/oauth-client.ts";

export const handler: Handlers = {
  async GET(req) {
    // `accessToken` and `sessionId` can be used for further consumption
    const { accessToken, response, sessionId } = await handleCallback(
      req,
      oauth2Client,
      "/", // an optional `redirectUrl` can be passed
    );

    return response;
  },
};
```

4. Use Deno KV OAuth's helper functions where needed. These could be part of a
   `_middleware.ts` handler.

```typescript
// routes/_middleware.ts
import type { MiddlewareHandlerContext } from "$fresh/server.ts";
import {
  getSessionAccessToken,
  getSessionId,
} from "https://deno.land/x/deno_kv_oauth/mod.ts";
import { oauth2Client } from "../utils/oauth-client.ts";

interface State {
  session: string | null;
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  const sessionId = await getSessionId(req);
  // example: use `!!ctx.state.session` to toggle `signin`/`signout` states.
  ctx.state.session = sessionId;

  if (sessionId != null) {
    // example: use the `sessionId` to get the `accessToken` to fetch the user from GitHub.
    const accessToken = await getSessionAccessToken(oauth2Client, sessionId);
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });
    const user = await response.json();

    console.log(user);
  }

  return await ctx.next();
}
```

5. Start your project with the necessary environment variables.

```sh
GITHUB_CLIENT_ID=xxx GITHUB_CLIENT_SECRET=xxx deno task start
```

## Using a custom OAuth 2.0 client

There is also the possibility to define
[custom OAuth 2.0 clients](https://deno.land/x/deno_kv_oauth#custom-oauth-20-client).

```typescript
// utils/oauth-client.ts
import { OAuth2Client } from "https://deno.land/x/oauth2_client/mod.ts";

export const oauth2Client = new OAuth2Client({
  clientId: Deno.env.get("CUSTOM_CLIENT_ID")!,
  clientSecret: Deno.env.get("CUSTOM_CLIENT_SECRET")!,
  authorizationEndpointUri: "https://custom.com/oauth/authorize",
  tokenUri: "https://custom.com/oauth/token",
  redirectUri: "https://my-site.com",
});
```

## Environment Variables

- `KV_PATH` (optional) - defines the path that Deno KV uses. See the API
  reference for further details.
- `${PROVIDER}_CLIENT_ID` and `${PROVIDER}_CLIENT_SECRET` - required when
  creating a pre-configured OAuth 2.0 client for a given provider. E.g. for
  Twitter, the environment variable keys are `TWITTER_CLIENT_ID` and
  `TWITTER_CLIENT_SECRET`.

> Note: reading environment variables requires the
> --allow-env[=<VARIABLE_NAME>...] permission flag. See
> [the manual](https://deno.com/manual/basics/permissions) for further details.
