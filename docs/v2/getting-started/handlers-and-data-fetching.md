---
description: |
  Add custom handlers to a route to customize HTTP headers, implement API
  routes, do data fetching for a rendered page, or handle form submissions.
---

Routes actually consist of two parts: handlers, and the page component. Up to
now, only the page component has been discussed in this chapter.

Handlers are functions that take a `Request` object and either return a
`Response` object, or some data that is passed to the page component during
rendering. They are called when a request is made to a particular route. There
can be one handler that covers all HTTP methods or one handler per method.

To define a handler in a route module, one must export it as a named export with
the name `handler`. Handlers can have two forms: a plain function (catchall for
all HTTP methods) or a plain object where each property is a function named by
the HTTP method it handles.

Here is an example of a custom `GET` handler that adds a header to the response

```tsx routes/about.tsx
import { render } from "@fresh/core";
import { State } from "../util.ts";

export const handler = {
  async GET(ctx) {
    const apiResp = await fetch("https://httpbin.org/uuid");
    const resp = await apiResp.json();

    return render(resp.uuid, {
      headers: { "X-UUID": resp.uuid },
    });
  },
} satisfies Handlers<State>;

export default function AboutPage(props: PageProps<typeof >) {
  return (
    <main>
      <h1>About</h1>
      <p>This is the about page.</p>
      <p>Your UUID is: {props.data}</p>
    </main>
  );
};
```

> [info]: The `defineHandlers` and `definePage` functions are helper functions
> that enable TypeScript to know the types of the `handler` and `AboutPage`
> functions. They are not required for the code to work, but they make your life
> easier because the props passed to the page component are typed to be the same
> as the data returned by the handler.

Note that handlers do not need to call `ctx.render()`. This feature can be used
to create API routes. Here is an API route that returns a random UUID as a JSON
response:

```ts routes/api/random-uuid.ts
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(_req) {
    const uuid = crypto.randomUUID();
    return new Response(JSON.stringify(uuid), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
```

Handlers can do much more, including fetching data from a database or external
API and passing it to their route.
