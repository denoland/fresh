---
description: |
  Fresh has built-in support for serving static files. This is useful for serving images, CSS, and other static assets.
---

Static assets placed in the `static/` directory are served at the root of the
webserver via the `staticFiles()` middleware. They are streamed directly from
disk for optimal performance with
[`ETag`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag)
headers.

```ts
import { staticFiles } from "fresh";

const app = new App()
  .use(staticFiles());
```

## Caching headers

By default, Fresh adds caching headers for the `src` and `srcset` attributes on
`<img>` and `<source>` tags.

```jsx
// Caching headers will be automatically added
<img src="/user.png" />;
```

You can always opt out of this behaviour per tag, by adding the
`data-fresh-disable-lock` attribute.

```jsx
// Opt-out of automatic caching headers
<img src="/user.png" data-fresh-disable-lock />;
```

## Adding caching headers manually

Use the `asset()` function to add caching headers manually. It will be served
with a cache lifetime of one year.

```jsx
import { asset } from "fresh/runtime";

// Adding caching headers manually
<a href={asset("/brochure.pdf")}>View brochure</a>;
```
