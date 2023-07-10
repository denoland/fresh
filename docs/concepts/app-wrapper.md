---
description: |
  Add a global application wrapper to provide common meta tags or context for application routes.
---

An application wrapper is defined in an `_app.tsx` file in `routes/` folder. It
must contain a default export that is a regular Preact component. Only one such
wrapper is allowed per application.

The component to be wrapped is received via props, in addition to a few other
things. This allows for the introduction of a global container functioning as a
template which can be conditioned based on state and params.

```tsx
// routes/_app.tsx

import { AppProps } from "$fresh/server.ts";

export default function App({ Component }: AppProps) {
  return (
    <div class="wrapper">
      <Component />
    </div>
  );
}
```
