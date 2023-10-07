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

### Loading data with async routes

For most routes, you'll probably need to load a bit of data before rendering the
HTML.

## API routes
