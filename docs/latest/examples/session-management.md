---
description: |
  How to manage a session using cookies.
---

This example is based on a
[MDN-Guide on HTTP-Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies).
Check it out for further information.

Why do we want to _manage a session_? A _session_ allows us to keep track of
e.g. a user or a shoppingcart. Basically it can be used to associate data with
an identifier, or even contain data itself. Cookies are the most common solution
for session management. Since [Deno](https://deno.land) uses standard WebAPIs
like `Request` & `Response`, it is quite easy to manage a session using cookies.

## Setup

1. Create a [new fresh-project](https://fresh.deno.dev/docs/getting-started) or
   use your own.
2. Add the `http`-package from the standard library:
   ```sh
   deno add jsr:@std/http
   ```

## Implementation

To a achieve the most basic implementation of session management we can
associate a random UUID with a request. We will use the global
[`crypto`](https://developer.mozilla.org/en-US/docs/Web/API/Window/crypto)-object
to generate a random UUID and the [`@std/http`](https://jsr.io/@std/http)
package to evaluate the cookies.

### Creating a cookie

```ts
import { setCookie } from "@std/http";

const headers = new Headers();
const uuid = crypto.randomUUID();
setCookie(headers, {
  name: "session",
  value: uuid,
});
```

This script will create a HTTP headers-object and assign a cookie named
_session_ with a random UUID as its value using `setCookie`.

Adding this headers-object to a response will make the browser attach the cookie
to the headers in every request.

### Retrieving a cookie

```ts
import { getCookies } from "@std/http";

// arbitrary headers-object used to showcase API
const cookies = getCookies(headers);
const uuid = cookies["session"];
```

By using `getCookie` we can retrieve the cookies of a headers-object as a
`Record<string, string>`. To access the value of a cookie we can index the
record by the cookie name as a key.

## Solution

We can use a middleware to get the `Request` from the `Context` and create a
`Response` for it. Using the previously mentioned methods we retrieve the
cookies from the `Request`. If there is no _session_ cookie already available,
we will create a _session_ cookie and add it to the `Response`.

```ts main.ts
import { getCookies, setCookie } from "@std/http";

export interface State {
  session: string;
}

// Session middleware
app.use(async (ctx: Context<State>) => {
  // Retrieve current session or generate a new one
  const cookies = getCookies(ctx.req.headers);
  const session = cookies["session"];
  ctx.state.session = session ?? crypto.randomUUID();

  // Run routes/middleware
  const response = await ctx.next();

  // Update session cookie if necessary
  if (!session) {
    setCookie(response.headers, {
      name: "session",
      value: ctx.state.session,
    });
  }
  return response;
});

// Use `ctx.state.session` in routes/middleware
app.get(
  "/",
  (ctx: Context<State>) =>
    new Response(`Your session ID is: ${ctx.state.session}`),
);
```

> [info]: This is a basic implementation. Expanding on this solution could mean
> adding a database to relate data to a session.
