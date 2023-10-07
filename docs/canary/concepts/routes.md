---
description: |
  Create a dynamic route in Fresh by adding a dynamic segment to the route name
  in the routes' file name on disk: `/greet/[name].tsx`.
---

At their core, routes describe how a request for a given path should be handled,
and what the response should be.

## Rendering HTML

If a route file contains a `default` export, then Fresh treats it as a
[Preact](https://preactjs.com/) component. We can use standard JSX to render
some HTML.

```tsx routes/index.tsx
import { PageProps } from "$fresh/server.ts";

export default function Page(props: PageProps) {
  return (
    <div>
      <h1>Hell world!</h1>
      <p>You are on the page '{props.url.href}'.</p>
    </div>
  );
}
```

When you go to your site, Fresh renders a heading with the text "Hello world!"
and a short paragraph that prints the URL that was visited.

## Responding to other HTTP verbs

When responding to a `POST` request or implementing an API you usually need to
respond to various different HTTP verbs. In Fresh this is done by exporting a
`handler` object or catchall function.

```tsx routes/api/index.tsx
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  POST(req) {
    // Do something with the incoming request
    return new Response("Success!");
  },
  // They can also be async
  async PATCH(req) {
    // Do something here
    return new Response("Success!");
  },
};
```

Handlers are functions that receive a `Request` object and must return a
`Response` object. The response object can either be created manually (for
example a JSON response for an API route), or it can be created by rendering the
page component. By default, all routes that don't define a custom handler use a
default handler that just renders the page component.

Handlers and components can also be as well. Here is an example of a custom
`GET` handler that renders the page component and then adds a custom header to
the response before returning it:

```tsx routes/about.tsx
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    // Renders the component
    const resp = await ctx.render();
    resp.headers.set("X-Custom-Header", "Hello");
    return resp;
  },
};

export default function AboutPage() {
  return (
    <main>
      <h1>About</h1>
      <p>This is the about page.</p>
    </main>
  );
}
```
