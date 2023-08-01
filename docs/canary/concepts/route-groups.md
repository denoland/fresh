---
description: |
  Route groups allow you to organize your route segments into groups and share layout or middleware code without affecting the URL structure.
---

When working with [route layouts](/docs/canary/concepts/route-layout) or
[route middlewares](/docs/canary/concepts/middleware) you'll sometimes come
across a situation where you want your routes to inherit from a different layout
than another route that's in the same URL segment.

Let's illustrate that with an example:

```txt
/about -> layout A
/career -> layout A
/archive -> layout B
/contact -> layout B
```

Without any way to group routes this is a problem because every route segment
can only have one `_layout` file.

```txt
/routes
  /_layout.tsx   <-- applies to all routes here :(
  /about.tsx
  /career.tsx
  /archive.tsx
  /contact.tsx
```

We can solve this problem with route groups. A route group is a folder which has
a name that is wrapped in braces. For example `(pages)` would be considered a
route and so would be `(marketing)`. This enables us to group related routes in
a folder and use a different `_layout` file for each group.

```txt
/routes
  /(marketing)
    /_layout.tsx   <-- only applies to about.tsx and career.tsx
    /about.tsx
    /career.tsx
  /(info)
    /_layout.tsx   <-- only applies to archive.tsx and contact.tsx
    /archive.tsx
    /contact.tsx
```

> ℹ️ Be careful about routes in different groups which match to the same URL.
> Such scenarios will lead to ambiguity as to which route file should be picked.
>
> ```txt
> /routes
>   /(group-1)
>     /about.tsx  <-- Bad: Both routes map to the same `/about` url
>   /(group-2)
>     /about.tsx  <-- Bad: Both routes map to the same `/about` url
> ```
