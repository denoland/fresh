---
description: |
  Add a layout to provide common meta tags, context for application sub routes, and common layout.
---

An layout is defined in a `_layout.tsx` file in any sub directory (at any level)
under the `routes/` folder. It must contain a default export that is a regular
Preact component. Only one such layout is allowed per sub directory.

```txt Project structure
└── routes
    ├── sub
    │   ├── page.tsx
    │   └── index.tss
    ├── other
    │   ├── _layout.tsx  # will be applied on top of `routes/_layout.tsx`
    │   └── page.tsx
    ├── _layout.tsx  # will be applied to all routes
    └── _app.tsx
```

The component to be wrapped is received via props, in addition to a few other
things. This allows for the introduction of a global container functioning as a
template which can be conditioned based on state and params. Note that any state
set by middleware is available via `props.state`.

```tsx routes/sub/_layout.tsx
import { LayoutProps } from "$fresh/server.ts";

export default function Layout({ Component, state }: LayoutProps) {
  // do something with state here
  return (
    <div class="layout">
      <Component />
    </div>
  );
}
```

## Async layouts

In case you need to fetch data asynchronously before rendering the layout, you
can use an async layout to do so.

```tsx routes/sub/_layout.tsx
import { LayoutProps } from "$fresh/server.ts";

export default async function Layout(req: Request, ctx: LayoutContext) {
  // do something with state here
  const data = await loadData();

  return (
    <div class="layout">
      <p>{data.greeting}</p>
      <ctx.Component />
    </div>
  );
}
```

### Define helper

To make it a little quicker to write async layouts, Fresh ships with a
`defineLayout` helper which automatically infers the correct types for the
function arguments.

```tsx
import { defineLayout } from "$fresh/server.ts";

export default defineLayout(async (req, ctx) => {
  const data = await loadData();

  return (
    <div class="layout">
      <p>{data.greeting}</p>
      <ctx.Component />
    </div>
  );
});
```

## Opting out of layout inheritance

Sometimes you want to opt out of the layout inheritance mechanism for a
particular route. This can be done via route configuration. Picture a directory
structure like this:

```txt Project structure
└── routes
    ├── sub
    │   ├── _layout_.tsx
    │   ├── special.tsx  # should not inherit layouts
    │   └── index.tss
    └── _layout.tsx
```

To make `routes/sub/special.tsx` opt out of rendering layouts we can set
`skipInheritedLayouts: true`.

```tsx routes/sub/special.tsx
import { RouteConfig } from "$fresh/server.ts";

export const config: RouteConfig = {
  skipInheritedLayouts: true, // Skip already inherited layouts
};

export default function MyPage() {
  return <p>Hello world</p>;
}
```

You can skip already inherited layouts inside a layout file:

```tsx routes/special/_layout.tsx
import { LayoutConfig } from "$fresh/server.ts";

export const config: LayoutConfig = {
  skipInheritedLayouts: true, // Skip already inherited layouts
};

export default function MyPage() {
  return <p>Hello world</p>;
}
```
