---
description: |
  Add a route layout to provide common meta tags, context for application sub routes, and common layout.
---

An route layout is defined in a `_layout.tsx` file in any sub directory (at any
level) under the `routes/` folder. It must contain a default export that is a
regular Preact component. Only one such layout is allowed per sub directory.

The component to be wrapped is received via props, in addition to a few other
things. This allows for the introduction of a global container functioning as a
template which can be conditioned based on state and params. Note that any state
set by middleware is available via `props.state`.

```tsx
// routes/sub/_layout.tsx

import { LayoutProps } from "$fresh/server.ts";

export default function Layout({ Component, state }: LayoutProps) {
  //do something with state here
  return (
    <div class="layout">
      <Component />
    </div>
  );
}
```
