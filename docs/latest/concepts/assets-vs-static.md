---
description: |
  Understanding the difference between the assets/ folder and the static/ folder when using Fresh with Vite.
---

When using Fresh with the Vite plugin (now the default), there are two ways to
include non-code files like images, fonts, or CSS in your application: the
`assets/` folder and the `static/` folder. While they may seem similar, they
serve different purposes and are handled differently by the build system.

## The `static/` folder

Files in the `static/` folder are served **as-is** at the root of your webserver
via Fresh's `staticFiles()` middleware.

```ts main.ts
import { App, staticFiles } from "fresh";

const app = new App()
  .use(staticFiles());
```

**Key characteristics:**

- Files are **not processed** by Vite's build pipeline
- Served directly at the root path (e.g., `static/logo.png` → `/logo.png`)
- During development: served by Vite's static middleware
- During production: copied as-is to the build output directory
- Optimal for files that don't need processing: HTML, PDFs, robots.txt, etc.

**Example usage:**

```tsx routes/about.tsx
import { asset } from "fresh/runtime";

export default function About() {
  // References static/brochure.pdf
  return <a href={asset("/brochure.pdf")}>Download brochure</a>;
}
```

See [Static files](/docs/concepts/static-files) for more details on caching
headers and the `asset()` function.

## The `assets/` folder

Files in the `assets/` folder are **imported as JavaScript modules** and
processed through Vite's build pipeline.

**Key characteristics:**

- Files are **processed** by Vite (optimized, transformed, fingerprinted)
- Imports return a URL string that includes a content hash for cache-busting
- During development: served by Vite's dev server with hot module reloading
- During production: optimized, fingerprinted, and bundled with your application
- Optimal for files referenced in code: images, CSS, fonts used in components

**Example usage:**

```tsx routes/home.tsx
import logo from "../assets/logo.png";
import "../assets/styles.css";

export default function Home() {
  // logo is a string like "/assets/logo-a1b2c3d4.png"
  return <img src={logo} alt="Logo" />;
}
```

```tsx islands/counter.tsx
import icon from "../assets/icon.svg";

export default function Counter() {
  // Works in islands too
  return (
    <button>
      <img src={icon} />Click me
    </button>
  );
}
```

## When to use which?

Use **`static/`** for:

- Public files accessed by URL path: `favicon.ico`, `robots.txt`, `sitemap.xml`
- Files you want to serve at specific paths: `/images/photo.jpg`
- Large files that shouldn't be bundled: PDFs, videos
- Files that external tools expect at specific URLs

Use **`assets/`** for:

- Images imported in components, routes, or islands
- CSS files imported in your code
- Fonts used in your stylesheets
- SVG icons used in components
- Any file that benefits from Vite's optimization and fingerprinting

## Technical details

When you import a file from `assets/`, Vite:

1. **Processes** the file (optimizes images, minifies CSS, etc.)
2. **Fingerprints** the filename with a content hash
3. **Returns** a URL string pointing to the processed file
4. **Bundles** the processed file with your application

This ensures optimal caching: browsers can cache the file forever because the
filename changes when the content changes.

Files in `static/` are not processed and keep their original names, relying on
Fresh's caching headers (via the `asset()` function) or HTTP headers you
configure.

## Migration note

If you're migrating from Fresh 1.x without Vite, your `static/` folder works the
same way. The `assets/` folder is a new convention that takes advantage of
Vite's module system for better optimization and developer experience.
