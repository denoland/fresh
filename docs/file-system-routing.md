# File system routing

The naming and location of files in the `pages` folder is important because
these are used to specify the route where a specific API endpoint or HTML page
is available. This concept is called file system routing.

As an example, the HTML page described by `index.tsx` would be served at `/`,
while the `about.tsx` page would be served at `/about`. File system routing is
also capable of dynamic path segments: `/posts/[post].jsx` would be be used for
requests to `/posts/foo`, `/posts/bar`, or `/posts/baz`, but not for
`/posts/foo/comments` (that would be matched by `/posts/[post]/comments.tsx`).
Multi-level dynamic segments are also possible: `/[owner]/[repo]/[...path]`
would match `/denoland/deno/README.md` and `/lucacasonato/fresh/cli/build.rs`.

Multi level dynamic segments can only be used as the last path segment.

## Comparison with path-to-regex

If you are more familiar with path-to-regex style routes, here is a simple
translation table to get you up to speed.

| `path-to-regex`         | File system routing                                                |
| ----------------------- | ------------------------------------------------------------------ |
| `/`                     | `/index.tsx`                                                       |
| `/about`                | `/about.tsx` or `/about/index.tsx`                                 |
| `/posts/:name`          | `/posts/[name].tsx` or `/posts/[name]/index.tsx`                   |
| `/posts/:name/comments` | `/posts/[name]/comments.tsx` or `/posts/[name]/comments/index.tsx` |
| `/x/:module/:path*`     | `/x/[module]/[...path].tsx`                                        |
