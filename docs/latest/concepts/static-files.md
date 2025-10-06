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

## Imported assets vs static files

When using Fresh with Vite (now the default), **files that you import in your
JavaScript/TypeScript code should not be placed in the `static/` folder**. This
prevents file duplication during the build process.

```tsx client.ts
// ❌ Don't import from static/
import "./static/styles.css";

// ✅ Import from outside static/ (e.g., assets/)
import "./assets/styles.css";
```

**Rule of thumb:**

- Files **imported in code** (CSS, icons, etc.) → Place outside `static/`
  (e.g., in an `assets/` folder)
- Files **referenced by URL path** (favicon.ico, fonts, robots.txt, PDFs, etc.) → Place
  in `static/`

When you import a file in your code, Vite processes it through its build
pipeline, optimizes it, and adds a content hash to the filename for cache
busting. Keeping these files outside `static/` ensures they're only included
once in your build output.

## Caching headers

By default, Fresh adds caching headers for the `src` and `srcset` attributes on
`<img>` and `<source>` tags.

```tsx main.tsx
// Caching headers will be automatically added
app.get("/user", (ctx) => ctx.render(<img src="/user.png" />));
```

You can always opt out of this behaviour per tag, by adding the
`data-fresh-disable-lock` attribute.

```tsx main.tsx
// Opt-out of automatic caching headers
app.get(
  "/user",
  (ctx) => ctx.render(<img src="/user.png" data-fresh-disable-lock />),
);
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
