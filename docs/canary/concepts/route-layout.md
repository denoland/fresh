---
description: |
  Add a route layout to provide common meta tags, context for application sub routes, and common layout.
---

An route layout is defined in a `_layout.tsx` file in any sub directory (at any
level) under the `routes/` folder. It must contain a default export that is a
regular Preact component. Only one such layout is allowed per sub directory.

```txt { "title": "Project structure" }
routes/
  _app.tsx
  _layout.tsx # will be applied to all routes
  sub/
    index.tsx
    page.tsx
  other/
    _layout.tsx # will be applied on top of `routes/_layout.tsx`
    page.tsx
```

The component to be wrapped is received via props, in addition to a few other
things. This allows for the introduction of a global container functioning as a
template which can be conditioned based on state and params. Note that any state
set by middleware is available via `props.state`.

```tsx { "title": "routes/sub/_layout.tsx" }
import type { LayoutProps } from "$fresh/server.ts";

export default function Layout({ Component, state }: LayoutProps) {
  //do something with state here
  return (
    <div class="layout">
      <Component />
    </div>
  );
}
```

## Opting out of layout inheritance

Sometimes you want to opt out of the layout inheritance mechanism for a
particular route. This can be done via route configuration. Picture a directory
structure like this:

```txt { "title": "Project structure" }
routes/
  _layout.tsx
  sub/
    _layout.tsx
    index.tsx
    special.tsx # should not inherit layouts
```

To make `routes/sub/special.tsx` opt out of rendering layouts we can set
`rootLayout: true`.

```tsx { "title": "routes/sub/special.tsx"}
import type { RouteConfig } from "$fresh/server.ts";

export const config: RouteConfig = {
  rootLayout: true, // Mark this route as the root layout
};

export default function MyPage() {
  return <p>Hello world</p>;
}
```

Note that you can also mark layouts as root layouts.

## Disabling the root `_app` template

In very rare cases you might want to disable the root `_app` template for a
particular route. This can be done by setting `appTemplate: false`.

```tsx { "title": "routes/my-page.tsx"}
import type { RouteConfig } from "$fresh/server.ts";

export const config: RouteConfig = {
  appTemplate: false, // Disable the `_app` template
};

export default function MyPage() {
  return <p>Hello world</p>;
}
```
