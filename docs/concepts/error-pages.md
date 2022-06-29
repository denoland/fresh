---
description: |
  Error pages can be used to customize the page that is shown when an error occurs in the application.
---

Fresh supports customizing the `404 Not Found`, and the
`500 Internal Server Error` pages. These are shown when a request is made but no
matching route exists, and when a middleware, route handler, or page component
throws an error respectively.

The 404 page can be customized by creating a `_404.tsx` file in the `routes/`
folder. The file must have a default export that is a regular Preact component.
A props object of type `UnknownPageProps` is passed in as an argument.

```tsx
/** @jsx h */
import { h } from "preact";
import { UnknownPageProps } from "$fresh/server.ts";

export default function NotFoundPage({ url }: UnknownPageProps) {
  return <p>404 not found: {url.pathname}</p>;
}
```

The 500 page can be customized by creating a `_500.tsx` file in the `routes/`
folder. The file must have a default export that is a regular Preact component.
A props object of type `ErrorPageProps` is passed in as an argument.

```tsx
/** @jsx h */
import { h } from "preact";
import { ErrorPageProps } from "$fresh/server.ts";

export default function Error500Page({ error }: ErrorPageProps) {
  return <p>500 internal error: {(error as Error).message}</p>;
}
```
