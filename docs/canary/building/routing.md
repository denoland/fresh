---
description: |
  Create a new route to a Fresh project by creating a new file in the `routes/`
  folder.
---

After getting the project running locally, the next step is to add a new route
to the project. Routes encapsulate the logic for handling requests to a
particular path in your project. They can be used to handle API requests or
render HTML pages.

Routes are defined as files in the `routes/` directory. The file name of the
module is important: it is used to determine the path that the route will
handle.

- File extensions are ignored.
- Literals in the file path are treated as string literals to match.
- Files named `<path>/index.<ext>` behave identically to a file named
  `<path>.<ext>`.
- Path segments can be made dynamic by surrounding an identifier with `[` and
  `]`.
- Paths where the last path segment follows the structure `[...<ident>]` are
  treated as having a wildcard suffix.

For example, if the file name is `index.js`, the route will handle requests to
`/`. If the file name is `about.js`, the route will handle requests to `/about`.
If the file name is `contact.js` and is placed inside of the `routes/about/`
folder, the route will handle requests to `/about/contact`. This concept is
called _File-system routing_.

Here is a table of file names, which route patterns they map to, and which paths
they might match:

| File name                    | Matching paths                            |
| ---------------------------- | ----------------------------------------- |
| `index.tsx`                  | `/`                                       |
| `about.tsx`                  | `/about`                                  |
| `blog/index.tsx`             | `/blog`                                   |
| `blog/[slug].tsx`            | `/blog/foo`, `/blog/bar`                  |
| `blog/[slug]/comments.tsx`   | `/blog/foo/comments`,`/blog/bar/comments` |
| `old/[...path].tsx`          | `/old/foo`, `/old/bar/baz`                |
| `docs/[[version]]/index.tsx` | `/docs`, `/docs/latest`, `/docs/canary`   |

## Advanced Routing

Sometimes routes can require that a more complex pattern that cannot be
expressed in a filename. In these scenarios a custom
[URL pattern](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API)
can be specified by exporting a `config` object in the route file. This pattern
will then be used instead of the file path based pattern:

```ts routes/my-route.ts
import { RouteConfig } from "$fresh/server.ts";

export const config: RouteConfig = {
  // Use this pattern instead of `my-route`
  routeOverride: "/x/:module@:version/:path*",
};

// ...
```
