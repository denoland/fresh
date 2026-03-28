---
description: |
  How Fresh processes requests: the flow from incoming request through middleware, routing, handlers, layouts, and island hydration.
---

Fresh is a server-first web framework. Pages are rendered on the server and only
the interactive parts ([islands](/docs/concepts/islands)) ship JavaScript to the
browser. This page explains how a request flows through the framework.

## Request lifecycle

<div style="max-width:620px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#1a1a1a;">
  <style>
    .flow-step{display:flex;align-items:flex-start;gap:16px}
    .flow-box{flex-shrink:0;width:200px;padding:10px 14px;border:1.5px solid #333;border-radius:6px;background:#f8f9fa;text-align:center}
    .flow-box strong{display:block;font-size:14px}
    .flow-box small{font-size:11px;color:#777}
    .flow-box.accent{background:#eef6ff}
    .flow-box.green{background:#f0faf0}
    .flow-desc{padding-top:10px;font-size:12.5px;color:#555;line-height:1.5}
    .flow-arrow{text-align:center;width:200px;color:#666;font-size:18px;line-height:1;padding:4px 0}
    .flow-arrow-label{text-align:center;width:200px;padding:2px 0}
    .flow-arrow-label em{font-size:11px;color:#777}
    .flow-divider{margin:12px 0 8px;padding-top:8px;border-top:1px dashed #e0e0e0;font-size:11px;color:#999;font-weight:600;letter-spacing:0.5px;text-transform:uppercase}
  </style>
  <!-- Browser Request -->
  <div class="flow-step">
    <div class="flow-box accent"><strong>Browser Request</strong></div>
  </div>
  <div class="flow-arrow">&#x2193;</div>
  <!-- Static Files -->
  <div class="flow-step">
    <div class="flow-box"><strong>Static Files</strong></div>
    <div class="flow-desc">Serve file directly if path matches a static asset</div>
  </div>
  <div class="flow-arrow-label"><em>no match</em></div>
  <div class="flow-arrow">&#x2193;</div>
  <!-- Global Middleware -->
  <div class="flow-step">
    <div class="flow-box"><strong>Global Middleware</strong><small>runs in registration order</small></div>
    <div class="flow-desc">Can modify request/response, set state, or short&#8209;circuit with a Response</div>
  </div>
  <div class="flow-arrow">&#x2193;</div>
  <!-- Router -->
  <div class="flow-step">
    <div class="flow-box"><strong>Router</strong></div>
    <div class="flow-desc">Match URL pattern + HTTP method. Static routes checked first, then dynamic.</div>
  </div>
  <div class="flow-arrow">&#x2193;</div>
  <!-- Scoped Middleware -->
  <div class="flow-step">
    <div class="flow-box"><strong>Scoped Middleware</strong></div>
    <div class="flow-desc">Middleware that only runs for matching path prefixes (e.g. /admin/*). Used for auth, logging, or other route&#8209;specific logic.</div>
  </div>
  <div class="flow-arrow">&#x2193;</div>
  <!-- Handler -->
  <div class="flow-step">
    <div class="flow-box"><strong>Handler</strong></div>
    <div class="flow-desc">API route? Return Response directly (JSON, redirect, etc.)</div>
  </div>
  <div class="flow-arrow-label"><em>has component</em></div>
  <div class="flow-arrow">&#x2193;</div>
  <!-- Rendering section -->
  <div class="flow-divider">Rendering</div>
  <!-- App Wrapper -->
  <div class="flow-step">
    <div class="flow-box"><strong>App Wrapper</strong></div>
    <div class="flow-desc">Outer &lt;html&gt;/&lt;head&gt;/&lt;body&gt; structure</div>
  </div>
  <div class="flow-arrow">&#x2193;</div>
  <!-- Layouts -->
  <div class="flow-step">
    <div class="flow-box"><strong>Layouts</strong></div>
    <div class="flow-desc">Nested layout components (inherited from parent directories)</div>
  </div>
  <div class="flow-arrow">&#x2193;</div>
  <!-- Page Component -->
  <div class="flow-step">
    <div class="flow-box"><strong>Page Component</strong></div>
    <div class="flow-desc">Route component receives props.data from handler</div>
  </div>
  <div class="flow-arrow">&#x2193;</div>
  <!-- HTML Response -->
  <div class="flow-step">
    <div class="flow-box accent"><strong>HTML + JS Response</strong><small>sent to browser</small></div>
    <div class="flow-desc">Server&#8209;rendered HTML with island props <a href="/docs/advanced/serialization">serialized</a> inline</div>
  </div>
  <!-- Client section -->
  <div class="flow-divider">Client (Browser)</div>
  <div class="flow-arrow">&#x2193;</div>
  <!-- Hydration -->
  <div class="flow-step">
    <div class="flow-box green"><strong>Island Hydration</strong><small>only islands receive JS</small></div>
    <div class="flow-desc">Rest of the page stays static HTML. No JavaScript for non&#8209;island components.</div>
  </div>
</div>

## Key concepts

### Server-first rendering

Every page is fully rendered to HTML on the server before being sent to the
browser. This means:

- Pages are visible immediately - no blank loading screens
- Search engines see complete content
- Pages work without JavaScript enabled

### Islands architecture

Fresh uses the
[islands architecture](https://jasonformat.com/islands-architecture/). Only
components in the `islands/` directory are [hydrated](/docs/concepts/islands) in
the browser. Everything else is static HTML that never runs JavaScript on the
client.

This means a page with a single interactive button only ships the JavaScript for
that button - not for the entire page.

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

Scoped middleware runs only for requests that match a specific path prefix. Pass
a path pattern as the first argument to `app.use()`:

```ts
app.use("/admin/*", async (ctx) => {
  // Only runs for /admin/* routes
  const user = ctx.state.user;
  if (!user?.isAdmin) return new Response("Forbidden", { status: 403 });
  return ctx.next();
});
```

Global middleware runs on every request; scoped middleware lets you apply logic
like authentication or logging to a subset of routes.

### Layout inheritance

[Layouts](/docs/concepts/layouts) wrap page components and are inherited from
parent directories. A page at `routes/blog/post.tsx` inherits layouts from:

1. `routes/_layout.tsx` (root layout)
2. `routes/blog/_layout.tsx` (section layout)

Layouts nest from the outside in: the root layout is outermost, each deeper
layout wraps closer to the page, and the innermost layout directly wraps the
page component. The [app wrapper](/docs/concepts/app) (`_app.tsx`) wraps
everything.

### Build and deploy

Fresh uses [Vite](https://vite.dev/) to bundle island JavaScript for production.
The `deno task build` command:

1. Discovers all islands and their dependencies
2. Bundles client-side JavaScript with code splitting
3. Generates a server entry point (`_fresh/server.js`)
4. Hashes assets for cache busting

In production, `_fresh/server.js` serves the pre-built assets. In development,
Vite provides Hot Module Replacement for instant feedback.
