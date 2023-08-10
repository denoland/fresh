---
description: |
  Add authentication to your project, by using Fresh's powerful auth system. 
---

Authentication and session management are essential for building modern web
applications, enabling you to hide premium content or create admin-only sections
like dashboards. Fresh is an edge-native web framework that embraces progressive
enhancement through server-side rendering and islands architecture while
optimizing for latency and performance. As a result, Fresh apps tend to achieve
higher Lighthouse scores and can function in areas with low internet bandwidth.

This guide covers the different ways to add authentication into your Fresh app,
emphasizing plugins, and integrating with other systems. Here are some examples:

## Basic Auth Plugin

A [basic auth plugin](https://github.com/hashrock/hashrock-fresh-plugins) (which
should only be used in your development environment) can be added to your Fresh
app like this:

```ts main.ts
import basicAuthPlugin from "https://deno.land/x/hashrock_fresh_plugins/basic.ts";

await start(manifest, {
  plugins: [basicAuthPlugin("/greet/")],
});
```

To use this plugin, create a .env file:

```.env
BASIC_AUTH_USER=user 
BASIC_AUTH_PASSWORD=password
```

## Deno KV Auth

Deno KV OAuth is a high-level OAuth 2.0 library powered by Deno KV. It can be
used for persistent session storage, integrating authentication workflows with
popular providers through OAuth 2.0.

The advantages of using Deno KV Auth are:

- Automatically handles the authorization code flow with Proof Key for Code
  Exchange (PKCE), access token refresh, and client redirection.
- Comes with pre-configured OAuth 2.0 clients for popular providers.
- Can work locally and in the cloud, including Deno Deploy.
- Based on the Request and Response interfaces from the Web API.
- Works with std/http’s serve(), Deno.serve(), and web frameworks such as Fresh
  and Oak. Here’s an example of using Deno KV OAuth with GitHub:

```ts
import { createGitHubOAuth2Client } from "https://deno.land/x/deno_kv_oauth/mod.ts";

const oauth2Client = createGitHubOAuth2Client();

// Sign-in, callback and sign-out handlers
async function handleSignIn(request: Request) {
  return await signIn(request, oauth2Client);
}

async function handleOAuth2Callback(request: Request) {
  return await handleCallback(request, oauth2Client);
}

async function handleSignOut(request: Request) {
  return await signOut(request);
}

// Protected route
// TODO: Make this a Fresh rout
async function getGitHubUser(accessToken: string): Promise<any> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const { message } = await response.json();
    throw new Error(message);
  }

  return await response.json();
}
```

You can find the full documentation and API reference for Deno KV Auth
[here](https://github.com/denoland/deno_kv_oauth).

## Custom Auth with Another System

In some cases, you may need to create a custom authentication solution to handle
specific requirements. You can build this solution by yourself and integrate it
with Fresh, leveraging Fresh’s routing and middleware system.

With Fresh and Deno, it’s easy to create a custom authentication and session
management solution. You can use the std/http/cookie module to implement
cookies, or choose a persistent data store like MongoDB for user accounts or
Redis for session management.

To protect a route, you can use middleware that checks whether the user has
valid credentials. Here’s an example of how this can be achieved:

```ts
import { getCookies } from "std/http/cookie.ts";

const authenticated = (handler) =>
  async function (req, ctx) {
    const cookies = getCookies(req.headers);
    if (cookies.authenticated) {
      const response = await handler(req, ctx);
      return response;
    } else {
      return Response.redirect("/login", 303);
    }
  };
```

You can use this middleware with any route that requires authentication.

That’s it for Configuring Auth! By following these examples, you can confidently
add various forms of authentication to your Fresh app to ensure security,
resilience, and scalability.
