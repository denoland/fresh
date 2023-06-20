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
2. Create your pre-configured OAuth client instance.

```typescript
import { createGitHubOAuth2Client } from "https://deno.land/x/deno_kv_oauth/mod.ts";

const oauth2Client = createGitHubOAuth2Client();
```

3. Using the OAuth 2.0 client instance, insert the authentication flow functions
   into your authentication routes.

```typescript
import {
  createGitHubOAuth2Client,
  handleCallback,
  signIn,
  signOut,
} from "https://deno.land/x/deno_kv_oauth/mod.ts";

const oauth2Client = createGitHubOAuth2Client();

async function handleSignIn(request: Request) {
  return await signIn(request, oauth2Client);
}

async function handleOAuth2Callback(request: Request) {
  return await handleCallback(request, oauth2Client);
}

async function handleSignOut(request: Request) {
  return await signOut(request);
}
```

4. Use Deno KV OAuth's helper functions where needed.

```typescript
import {
  createGitHubOAuth2Client,
  getSessionAccessToken,
  getSessionId,
} from "https://deno.land/x/deno_kv_oauth/mod.ts";

const oauth2Client = createGitHubOAuth2Client();

async function handleAccountPage(request: Request) {
  const sessionId = await getSessionId(request);
  const isSignedIn = sessionId != null;

  if (!isSignedIn) return new Response(null, { status: 404 });

  const accessToken = await getSessionAccessToken(oauth2Client, sessionId);
  return Response.json({ isSignedIn, accessToken });
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
import { OAuth2Client } from "https://deno.land/x/oauth2_client/mod.ts";

const client = new OAuth2Client({
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
