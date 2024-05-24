---
description: |
  Add custom handlers to a route to customize HTTP headers, implement API
  routes, do data fetching for a rendered page, or handle form submissions.
---

Routes actually consist of two parts: handlers, and the page component. Up to
now, only the page component has been discussed in this chapter.

Handlers are functions that take a `Request` object and either return a
`Response` object, or a `PageResponse` object which will cause the page
component to get rendered. Handlers are called when a request is made to a
particular route. There can be one handler that covers all HTTP methods or one
handler per method.

To define a handler in a route module, one must export it as a named export with
the name `handler`. Handlers can have two forms: a plain function (catchall for
all HTTP methods) or a plain object where each property is a function named by
the HTTP method it handles.

Here is an example of a custom `GET` handler that just adds a custom header to
the response:

```tsx routes/about.tsx
import { page } from "@fresh/core";
import { define } from "../util.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const resp = page();
    resp.headers.set("X-Custom-Header", "Hello");
    return resp;
  },
});

export default function AboutPage() {
  return (
    <main>
      <h1>About</h1>
      <p>This is the about page.</p>
    </main>
  );
}
```

> [info]: The `define.handlers` function is a helper that ensures that the `ctx`
> parameter passed to the handler is typed correctly, and ensures that the
> handler you are defining is a valid handler.
>
> It is not required for the code to work, but is recommended because it makes
> the experience of writing handlers more pleasant.

You can also pass data from the handler to the page component. This is done by
calling the `page` function with the data as an argument.

```tsx routes/about.tsx
import { page } from "@fresh/core";
import { define } from "../util.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const data = { message: "Hello from the handler!" };
    return page(data);
  },
});

export default define.page<typeof handler>(function AboutPage(props) {
  return (
    <main>
      <h1>About</h1>
      <p>{props.data.message}</p>
    </main>
  );
});
```

> [info]: The `define.page` helper is used to ensure that the `props` parameter
> passed to the page component is typed correctly. It will automatically infer
> the type of `props.data` based on the data passed to the `page` function in
> the handler.

Handlers do not have to call the `page` function. This can be used to implement
API routes, or perform redirects. Here is an example of a handler that redirects
to the `/about` page:

```tsx routes/index.tsx
import { define } from "../util.ts";

export const handler = define.handlers({
  async GET(_ctx) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/about" },
    });
  },
});
```

And here is a handler that returns a JSON response:

```tsx routes/api/random-uuid.ts
import { define } from "../util.ts";

export const handler = define.handlers({
  async GET(_ctx) {
    const uuid = crypto.randomUUID();
    return new Response(JSON.stringify(uuid), {
      headers: { "Content-Type": "application/json" },
    });
  },
});
```
