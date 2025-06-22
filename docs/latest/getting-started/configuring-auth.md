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

For a look at how you can manually bring Deno KV Auth into your project, see
[this example](](/docs/examples/using-deno-kv-oauth.md).

To quickly configure your application using a Deno Fresh plugin, you can see the
documentation for the
[Deno Fresh KV Auth plugin](https://deno.land/x/deno_fresh_kv_oauth).

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
