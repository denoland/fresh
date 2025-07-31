---
description: |
  Fresh has built-in support for serving static files. This is useful for serving images, CSS, and other static assets.
---

Static assets placed in the `static/` directory are served at the root of the
webserver via the `staticFiles()` middleware. They are streamed directly from
disk for optimal performance with
[`ETag`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag)
headers.

```ts main.ts
import { staticFiles } from "fresh";

const app = new App()
  .use(staticFiles());
```

The path to the static file directory can be customized on the
[`Builder` class](/docs/canary/concepts/builder) inside your `dev.ts` file.

```ts dev.ts
import { Builder } from "fresh/dev";

const builder = new Builder({ staticDir: "path/to/staticDir" });
```

## Caching headers

By default, Fresh adds caching headers for the `src` and `srcset` attributes on
`<img>` and `<source>` tags.

```tsx main.tsx
// Caching headers will be automatically added
app.get("/user", () => <img src="/user.png" />);
```

You can always opt out of this behaviour per tag, by adding the
`data-fresh-disable-lock` attribute.

```tsx main.tsx
// Opt-out of automatic caching headers
app.get("/user", () => <img src="/user.png" data-fresh-disable-lock />);
```

## Adding caching headers manually

Use the `asset()` function to add caching headers manually. It will be served
with a cache lifetime of one year.

```tsx routes/about.tsx
import { asset } from "fresh/runtime";

export default function About() {
  // Adding caching headers manually
  return <a href={asset("/brochure.pdf")}>View brochure</a>;
}
```
