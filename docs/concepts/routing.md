---
description: |
  File based routing is the simplest way to do routing in Fresh apps. Additionally custom patterns can be configured per route.
---

Routing is the mechanism that determines what route a given incoming request is
handled by. Fresh routes requests based on their URL path. By default routes
specify which paths they are invoked for using the name of the file. Routes can
also define a custom [URL pattern][urlpattern] to match against for more
advanced use cases.

The file based routing in Fresh is very similar to the file based routing seen
in other frameworks, namely Next.js. File names are used to determine which
route a given request should be handled by. The pattern is determined based on
the path of the file on disk, relative to the `routes/` directory.

File names are mapped to route patterns as follows:

- File extensions are ignored.
- Literals in the file path are treated as string literals to match.
- Files named `<path>/index.<ext>` behave identically to a file named
  `<path>.<ext>`.
- Path segments can be made dynamic by surrounding an identifier with `[` and
  `]`.
- Paths where the last path segment follows the structure `[...<ident>]` are
  treated as having a wildcard suffix.

Here is a table of file names, which route patterns they map to, and which paths
they might match:

| File name                 | Route pattern          | Matching paths             |
| ------------------------- | ---------------------- | -------------------------- |
| `index.ts`                | `/`                    | `/`                        |
| `about.ts`                | `/about`               | `/about`                   |
| `blog/index.ts`           | `/blog`                | `/blog`                    |
| `blog/[slug].ts`          | `/blog/:slug`          | `/blog/foo`, `/blog/bar`   |
| `blog/[slug]/comments.ts` | `/blog/:slug/comments` | `/blog/foo/comments`       |
| `old/[...path].ts`        | `/old/:path*`          | `/old/foo`, `/old/bar/baz` |

Advanced use-cases can require that a more complex pattern be used for matching.
A custom [URL pattern][urlpattern] can be specified in the route configuration.
This pattern will be used instead of the file path based pattern:

```ts
// routes/x.ts

import { RouteConfig } from "$fresh/runtime.ts";

const config: RouteConfig = {
  routeOverride: "/x/:module@:version/:path*",
};

// ...
```

[urlpattern]: https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API
