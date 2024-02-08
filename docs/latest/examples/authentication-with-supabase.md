---
description: |
  Learn how to implement the PKCE authentication flow using Supabase.
---

Fresh is a great tool for quickly building lightweight, server-side rendered web apps and Supabase provides an easy way to add authentication (and/or a PostgreSQL database backend) to your app.

In this example, we'll create a small app that implements the PKCE authentication flow using Supabase.

The PKCE authentication flow is designed specifically for applications that cannot store a client secret, such as native mobile apps or server-side rendered web apps. You can read up on the specifics of PKCE [here](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce) or have a look at [its specification](https://datatracker.ietf.org/doc/html/rfc7636). Our example is based on the information you can piece together from the [Supabase documentation](https://supabase.com/docs/guides/auth/server-side/oauth-with-pkce-flow-for-ssr) on the topic.

With that out of the way, let's jump right in. To keep this brief, we'll only present the basic building blocks of the app so you should already be familiar with [how to set up a Fresh app](https://fresh.deno.dev/docs/getting-started). You can find the full code [here](https://github.com/morlinbrot/supa-fresh-pkce).

## Supabase

First of all, we need a Supabase account [which can be created for free here](https://supabase.com/). A handy way to support the credentials is via `.env` file (never check in `.env` files to version control).
```txt .env.example
SUPABASE_URL=https://<projectName>.supabase.co
SUPABASE_ANON_KEY=<api_key>
```

<details>
<summary>imports and .env files</summary>

Update the imports section of your `deno.json` file include the following:

```json deno.json
"imports": {
    "supabase": "npm:@supabase/supabase-js@2",
    "supabase/ssr": "npm:@supabase/ssr",
}
```

Put this in your `main.ts` to read from the `.env` file:
```ts main.ts
import "$std/dotenv/load.ts";
```

</details>


### Interlude: Theoretical Background
Traditionally, JavaScript SDKs like the one from Supabase are initalised with a client secret and each client would simply hold their own instance to communicate with the API. This concept doesn't work too well with server-side rendering (SSR), though.

In the context of SSR, since each page render is a new request to the server, the server is blind to which client it is rendering the page for and if they are authenticated or not. The simple way to solve this is to simply pass some sort of access token with each request (e.g. cookies) - but that is obviously quite insecure as requests could be intercepted and credentials be spoofed.

Th PKCE flow solves this by introducing a "code verifier" token that the client sends with each request that can be verified by the authorization server (how exactly this works is [actually quite interesting](https://datatracker.ietf.org/doc/html/rfc7636#section-1.1)). This way, our server can remain stateless and we can use cookies to track which request belongs to which client.

### `@supabase/ssr`

Supabase provides the `@supabase/ssr` package for working with its API in an SSR context. It exposes the `createServerClient` method that we can use on the server side. Set it up like so:

```ts lib/supabase.ts
export function createSupabaseClient(
  req: Request,
  // Keep this optional parameter in mind, we'll get back to it.
  resHeaders: Headers = new Headers(),
) {
  return createServerClient(
    SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "",
    SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "",
    {
      auth: { flowType: "pkce" },
      cookies: {
        get(name: string) {
          return decodeURIComponent(getCookies(req.headers)[name]);
        },
        set(name: string, value: string, options: CookieOptions) {
          setCookie(resHeaders, { name, value: encodeURIComponent(value), ...options });
        },
        remove(name: string, options: CookieOptions) {
          deleteCookie(resHeaders, name, options);
        },
      },
    },
  );
}
```

Note that we are specifying the `flowType` to be `"pkce"` and that we're using `encodeURIComponent` to serialize and store the session object as a cookie.

Crucially, _we need to create a new instance of this client for each request!_

## Sign Up

In our endpoints, we can now use this client to talk to the Supabase API. Here's the `/api/sign-up` handler:

```ts routes/api/sign-up.ts
export const handler: Handlers = {
  async POST(req: Request, _ctx: FreshContext) {
    const form = await req.formData();
    const email = form.get("email");
    const password = form.get("password");

    const headers = new Headers();
    headers.set("location", "/sign-in"); // Redirect to /sign-in on success.

    const supabase = createSupabaseClient(req);
    const { error } = await supabase.auth.signUp({
      email: String(email),
      password: String(password),
    });
    if (error) throw error;

    return new Response(null, { status: 303, headers });
  },
};
```

Create a form to call our api endpoint and render it at `/sign-up`:

```tsx routes/sign-up.tsx
export default function SignUpPage({ mode }: Props) {
  return (
      <form method="post">
        <input autofocus type="email" name="email" />
        <input type="password" name="password" /> 
        <button type="submit" formAction={"/api/sign-up"}>Submit</button>
      </form>
  )
}
```

## Confirmation

To complete the sign up process, we need a `/confirm` route to intercept successful e-mail confirmations:
```ts routes/api/confirm.ts
export const handler: Handlers = {
  async GET(req: Request) {
    const url = new URL(req.url);
    const { searchParams } = url;
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const next = searchParams.get("next") ?? "/welcome";

    const redirectTo = new URL(url);
    redirectTo.pathname = next;

    if (token_hash && type) {
      const supabase = createSupabaseClient(req);
      const { error } = await supabase.auth.verifyOtp({ type, token_hash });
      if (error) throw error;
    }

    redirectTo.searchParams.delete("next");
    return Response.redirect(redirectTo);
  },
};
```

Have a look at the Supabase docs on the [details on how to configure e-mail templates and other endpoints](https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr) like `/password-reset` you would need for a full implementation.


## Sign In

The `/api/sign-in` route is pretty straight-forward, too:

```ts routes/api/sign-in.ts
export const handler: Handlers = {
  async POST(req) {
    const form = await req.formData();
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    const headers = new Headers();
    headers.set("location", "/");

    const supabase = createSupabaseClient(req, headers);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;

    return new Response(null, { status t 303, headers });
  },
};
```

Note that we're passing `headers` this time. The Supabase client will set the session as cookie for us which we will want to pick up in the middleware that we are writing next.

## Middleware

We can now write a middleware that will check the auth status of any request, guarding any protected routes. You can read up on middlewares and where to put them [in the docs](https://fresh.deno.dev/docs/concepts/middleware).

```ts routes/_middleware.ts
export const handler = [
  async function authMiddleware(req: Request, ctx: FreshContext) {
    const url = new URL(req.url);
    const headers = new Headers();
    headers.set("location", "/");

    const supabase = createSupabaseClient(req, headers);
    // NOTE: Always use `getUser` instead of `getSession` as this calls the Supabase API and revalidates the token!
    const { error, data: { user } } = await supabase.auth.getUser();

    const isProtectedRoute = url.pathname.includes("secret");

    // Don't mind 401 as it just means no credentials were provided, e.g. there was no session cookie.
    if (error && error.status !== 401) throw error;

    if (isProtectedRoute && !user) {
      return new Response(null, { status: 303, headers });
    }

    ctx.state.user = user;

    return ctx.next();
  },
];
```

That's it! These are the building blocks for implementing the PKCE authentication flow in a Fresh app using Supabase.

## Closing Notes

The purpose of the example app we built here is to showcase the basic building blocks of an implementation. As such, it is limited in functionality and purposefully leaves out things like [password reset](https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr), [error handling](https://fresh.deno.dev/docs/concepts/error-pages) and passing server state to components.

You can find a fully-fletched [version of the app here](https://github.com/morlinbrot/supa-fresh-pkce).
