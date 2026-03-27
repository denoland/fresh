---
description: |
  Common patterns and recipes for Fresh applications: authentication, redirects, content negotiation, cookies, and more.
---

This page collects common patterns you'll encounter when building Fresh apps.

## Protected routes

Use middleware to check authentication and redirect unauthenticated users:

```ts routes/dashboard/_middleware.ts
import { define } from "@/utils.ts";

export default define.middleware(async (ctx) => {
  const session = await getSession(ctx.req);
  if (!session) {
    return ctx.redirect("/login");
  }
  ctx.state.user = session.user;
  return ctx.next();
});
```

All routes under `routes/dashboard/` are now protected. The user data is
available in any downstream handler or component via `ctx.state.user`.

## Redirect old URLs

Handle URL migrations with middleware:

```ts routes/_middleware.ts
const REDIRECTS: Record<string, string> = {
  "/old-page": "/new-page",
  "/blog/old-slug": "/blog/new-slug",
};

export default function handler(ctx) {
  const redirect = REDIRECTS[ctx.url.pathname];
  if (redirect) {
    return ctx.redirect(redirect, 301);
  }
  return ctx.next();
}
```

> [info]: `ctx.redirect()` includes protection against open redirect attacks.
> Protocol-relative URLs like `//evil.com` are rejected.

## Content negotiation

Return different formats based on the `Accept` header:

```ts routes/api/users/[id].ts
import { define } from "@/utils.ts";

export const handlers = define.handlers({
  async GET(ctx) {
    const user = await db.users.find(ctx.params.id);
    if (!user) {
      throw new HttpError(404);
    }

    const accept = ctx.req.headers.get("Accept") ?? "";
    if (accept.includes("text/html")) {
      return ctx.render(<UserProfile user={user} />);
    }
    return Response.json(user);
  },
});
```

## Setting cookies

Use the `@std/http` cookie utilities:

```ts routes/_middleware.ts
import { getCookies, setCookie } from "@std/http";

export default async function handler(ctx) {
  const cookies = getCookies(ctx.req.headers);
  ctx.state.theme = cookies["theme"] ?? "light";

  const response = await ctx.next();

  // Set a cookie on the response
  setCookie(response.headers, {
    name: "theme",
    value: ctx.state.theme,
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return response;
}
```

See [Session management](/docs/examples/session-management) for a complete
session example.

## Reading query parameters

Access URL search params from the context:

```ts routes/search.tsx
import { define } from "@/utils.ts";

export const handlers = define.handlers({
  GET(ctx) {
    const query = ctx.url.searchParams.get("q") ?? "";
    const page = Number(ctx.url.searchParams.get("page") ?? "1");
    const results = search(query, page);
    return page({ query, results });
  },
});
```

## Adding response headers

Set custom headers in middleware or handlers:

```ts routes/_middleware.ts
export default async function handler(ctx) {
  const response = await ctx.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
```

Or set headers on a specific route using `page()`:

```ts
import { page } from "fresh";

return page(data, {
  headers: { "Cache-Control": "public, max-age=3600" },
});
```

## Streaming responses

Return a streaming response from a handler:

```ts routes/api/stream.ts
export const handlers = define.handlers({
  GET() {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("Hello "));
        setTimeout(() => {
          controller.enqueue(new TextEncoder().encode("World!"));
          controller.close();
        }, 1000);
      },
    });
    return new Response(body, {
      headers: { "Content-Type": "text/plain" },
    });
  },
});
```

## WebSockets

Fresh runs on Deno, so you can upgrade HTTP connections to WebSockets directly:

```ts routes/api/ws.ts
export const handlers = define.handlers({
  GET(ctx) {
    const { socket, response } = Deno.upgradeWebSocket(ctx.req);

    socket.onopen = () => {
      console.log("Client connected");
    };
    socket.onmessage = (event) => {
      socket.send(`Echo: ${event.data}`);
    };
    socket.onclose = () => {
      console.log("Client disconnected");
    };

    return response;
  },
});
```

## Timing middleware

Measure how long request processing takes:

```ts routes/_middleware.ts
export default async function handler(ctx) {
  const start = performance.now();
  const response = await ctx.next();
  const duration = performance.now() - start;
  response.headers.set("Server-Timing", `total;dur=${duration.toFixed(1)}`);
  return response;
}
```
