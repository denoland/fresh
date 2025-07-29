---
description: |
  Routes are the basic building block of Fresh applications. They are used to define the behaviour the application when a given path is requested.
---

Use the `.fsRoutes()` helper on the [`App`](/docs/canary/concepts/app) instance
to specify where file based routes should be inserted. It adds routes based on
the structure in the `routes/` folder in your project (or any other folder you
have set in `dev.ts`). When you add a new file there, it will register a new
route automatically.

```ts main.ts
import { Builder } from "fresh/dev";

// Optionally set a custom route dir (will be `<root>/routes` by default)
const builder = new Builder({ routeDir: "path/to/routes" });

if (Deno.args.includes("build")) {
  await builder.build();
} else {
  await builder.listen(() => import("./main.ts"));
}
```

```ts main.ts
import { App, staticFiles } from "fresh";

const app = new App({ root: import.meta.url })
  .use(staticFiles())
  .fsRoutes(); // This inserts all file based routes here
```

> [info]: The `staticFiles()` middleware is required when using file based
> routing. Otherwise the necessary JavaScript files for islands won't be served
> to the browser.

Example project structure:

```sh Project structure
├── deno.json
├── main.ts
├── dev.ts
└── routes
    ├── (marketing)  # Route group, used to group related routes
    │   ├── _layout.tsx  # Apply layout to all routes in this directory
    │   ├── about.tsx    # /about route
    │   ├── career.tsx   # /career route
    │   ├── (_components)  # related components
    │   │   └── newsletter-cta.tsx
    │   └── (_islands)  # Local island directory
    │       └── interactive-stats.tsx # Fresh treats this as an island
    └── shop
        ├── (_components)
        │   └── product-card.tsx
        ├── (_islands)
        │   └── cart.tsx # Fresh treats this as an island
        └── index.tsx
```

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

| File name                   | Route pattern          | Matching paths                          |
| --------------------------- | ---------------------- | --------------------------------------- |
| `index.ts`                  | `/`                    | `/`                                     |
| `about.ts`                  | `/about`               | `/about`                                |
| `blog/index.ts`             | `/blog`                | `/blog`                                 |
| `blog/[slug].ts`            | `/blog/:slug`          | `/blog/foo`, `/blog/bar`                |
| `blog/[slug]/comments.ts`   | `/blog/:slug/comments` | `/blog/foo/comments`                    |
| `old/[...path].ts`          | `/old/:path*`          | `/old/foo`, `/old/bar/baz`              |
| `docs/[[version]]/index.ts` | `/docs{/:version}?`    | `/docs`, `/docs/latest`, `/docs/canary` |

Advanced use-cases can require that a more complex pattern be used for matching.
A custom [URL pattern][urlpattern] can be specified in the route configuration.
This pattern will be used instead of the file path based pattern:

```ts routes/my-route.ts
import { RouteConfig } from "fresh";

export const config: RouteConfig = {
  routeOverride: "/x/:module@:version/:path*",
};

// ...
```

## Route Groups

When working with [layouts](/docs/concepts/layouts) or
[middlewares](/docs/concepts/middleware), you'll sometimes come across a
situation where you want your routes to inherit from a layout other than what's
suggested by the URL segment.

Let's illustrate that with an example:

```txt
/about -> layout A
/career -> layout A
/archive -> layout B
/contact -> layout B
```

Without any way to group routes this is a problem because every route segment
can only have one `_layout` file.

```txt Project structure
└── routes
    ├── _layout.tsx  # applies to all routes here :(
    ├── about.tsx
    ├── career.tsx
    ├── archive.tsx
    └── contact.tsx
```

We can solve this problem with route groups. A route group is a folder which has
a name that is wrapped in parentheses. For example `(info)` would be considered
a route group and so would `(marketing)`. This enables us to group related
routes in a folder and use a different `_layout` file for each group.

```txt Project structure
└── routes
    ├── (marketing)
    │   ├── _layout.tsx  # only applies to about.tsx and career.tsx
    │   ├── about.tsx
    │   └── career.tsx
    └── (info)
        ├── _layout.tsx  # only applies to archive.tsx and contact.tsx
        ├── archive.tsx
        └── contact.tsx
```

> [warn]: Be careful about routes in different groups which match to the same
> URL. Such scenarios will lead to ambiguity as to which route file should be
> picked.
>
> ```txt Project structure
> └── routes
>     ├── (group-1)
>     │   └── about.tsx  # Bad: Maps to same `/about` url
>     └── (group-2)
>         └── about.tsx  # Bad: Maps to same `/about` url
> ```

[urlpattern]: https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API
