---
description: |
  How Fresh processes requests: the flow from incoming request through middleware, routing, handlers, layouts, and island hydration.
---

Fresh is a server-first web framework. Pages are rendered on the server and only
the interactive parts (islands) ship JavaScript to the browser. This page
explains how a request flows through the framework.

## Request lifecycle

```
  Browser Request
        │
        ▼
  ┌─────────────┐
  │ Static Files │──▶ Serve file directly (if match)
  └─────┬───────┘
        │ (no match)
        ▼
  ┌─────────────┐
  │ Middlewares  │──▶ Run in registration order
  │ (global)    │    Can modify request/response, set state,
  └─────┬───────┘    or short-circuit with a Response
        │
        ▼
  ┌─────────────┐
  │   Router    │──▶ Match URL pattern + HTTP method
  └─────┬───────┘    Static routes checked first, then dynamic
        │
        ▼
  ┌─────────────┐
  │ Middlewares  │──▶ Path-specific middlewares
  │ (scoped)    │
  └─────┬───────┘
        │
        ▼
  ┌─────────────┐     ┌────────────┐
  │   Handler   │────▶│ API route  │──▶ Return Response (JSON, etc.)
  └─────┬───────┘     └────────────┘
        │ (has component)
        ▼
  ┌─────────────┐
  │ App Wrapper │──▶ Outer <html>/<head>/<body> structure
  └─────┬───────┘
        │
        ▼
  ┌─────────────┐
  │   Layouts   │──▶ Nested layout components (inherited)
  └─────┬───────┘
        │
        ▼
  ┌─────────────┐
  │    Page     │──▶ Route component with props.data
  │  Component  │
  └─────┬───────┘
        │
        ▼
  ┌─────────────┐
  │  HTML + JS  │──▶ Server-rendered HTML sent to browser
  │  Response   │    Island props serialized inline
  └─────────────┘

        Browser
        │
        ▼
  ┌─────────────┐
  │  Hydration  │──▶ Only islands receive JavaScript
  │  (Islands)  │    Rest of the page stays static HTML
  └─────────────┘
```

## Key concepts

### Server-first rendering

Every page is fully rendered to HTML on the server before being sent to the
browser. This means:

- Pages are visible immediately — no blank loading screens
- Search engines see complete content
- Pages work without JavaScript enabled

### Islands architecture

Fresh uses the
[islands architecture](https://jasonformat.com/islands-architecture/). Only
components in the `islands/` directory are hydrated in the browser. Everything
else is static HTML that never runs JavaScript on the client.

This means a page with a single interactive button only ships the JavaScript for
that button — not for the entire page.

### Middleware chain

Middlewares execute in registration order, wrapping the handler. Each middleware
calls `ctx.next()` to pass control to the next middleware (or handler). This
creates an onion-like pattern where middlewares can act on both the request
(before `ctx.next()`) and the response (after `ctx.next()`):

```ts
app.use(async (ctx) => {
  // Before: runs on the way in
  console.log("Request:", ctx.url.pathname);

  const response = await ctx.next();

  // After: runs on the way out
  console.log("Status:", response.status);
  return response;
});
```

### Layout inheritance

Layouts wrap page components and are inherited from parent directories. A page
at `routes/blog/post.tsx` inherits layouts from:

1. `routes/_layout.tsx` (root layout)
2. `routes/blog/_layout.tsx` (section layout)

The innermost layout wraps the page component, and each outer layout wraps the
next. The app wrapper (`_app.tsx`) wraps everything.

### Build and deploy

Fresh uses [Vite](https://vite.dev/) to bundle island JavaScript for production.
The `deno task build` command:

1. Discovers all islands and their dependencies
2. Bundles client-side JavaScript with code splitting
3. Generates a server entry point (`_fresh/server.js`)
4. Hashes assets for cache busting

In production, `_fresh/server.js` serves the pre-built assets. In development,
Vite provides Hot Module Replacement for instant feedback.
