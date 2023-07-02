---
description: |
  An easier way to access props from within your component tree.
---

Unsatisfied by having to use `useContext` manually to pass things down component
hierarchies? `useProps` provides a solution! Let's dive into an example to see
how it can help you out.

Imagine we have the following `/routes/my_page.tsx`

```tsx
import { MultiHandler, PageProps } from "$fresh/server.ts";
import Child from "../components/Child.tsx";

export const handler: MultiHandler = {
  async GET(_req, ctx) {
    const complexValue = "computing this is really hard";
    const resp = await ctx.render(complexValue);
    return resp;
  },
};

export default function Page(props: PageProps<string>) {
  return <Child />;
}
```

And then we have some helper components to simulate a large component hierarchy:
`/components/Child.tsx`

```tsx
import Grandchild from "./Grandchild.tsx";

export default function Child() {
  return <Grandchild />;
}
```

and `/components/Grandchild.tsx`

```tsx
import { useProps } from "$fresh/runtime.ts";

export default function Grandchild() {
  const props = useProps();
  if (props.data === "computing this is really hard") {
    return <div>{props.url.toString()}</div>;
  }
  return <div></div>;
}
```

The `useProps` function is built in to the Fresh runtime and gives you access to
`PageProps` anywhere within your component tree. As a reminder, `PageProps` has
lots of useful information in it, so you'll have access to the following data:

```ts
export interface PageProps<T = any, S = Record<string, unknown>> {
  url: URL;
  route: string;
  params: Record<string, string>;
  data: T;
  state: S;
}
```

In our example we're accessing the `data` computed by our handler (remember,
it's "very expensive"!) and the url of the request. But we also have access to
any `state` computed by our middleware, the route that was matched, and any
params.
