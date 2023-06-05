---
description: |
  Add a global application wrapper to provide common meta tags or context for application routes.
---

An application wrapper is defined in an `_app.tsx` file in `routes/` folder. It
must contain a default export that is a regular Preact component. Only one such
wrapper is allowed per application.

It receives component through props which is to be wrapped. For instance, it
allows to introduce a global container for the whole application.

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
