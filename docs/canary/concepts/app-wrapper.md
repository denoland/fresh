---
description: |
  Add a global app wrapper to provide common meta tags or context for application routes.
---

An app wrapper is defined in an `_app.tsx` file in `routes/` folder and is
typically used to create the outer structure of an HTML document. It must
contain a default export that is a regular Preact component. Only one such
wrapper is allowed per application.

The component to be wrapped is received via props, in addition to a few other
things. This allows for the introduction of a global container functioning as a
template which can be conditioned based on state and params. Note that any state
set by middleware is available via `props.state`.

```tsx routes/_app.tsx
import { define } from "../utils/state.ts";

export default define.page(function App({ Component, state }) {
  // do something with state here
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My Fresh app</title>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
});
```

## Async app wrapper

Similar to routes and layouts, the app wrapper can be made asynchronous. This
changes the function signature so that the first argument is the `Request`
instance and the second one is the `FreshContext`.

```tsx routes/_app.tsx
import { define } from "../utils/state.ts";

export default define.page(async function App(props) {
  const data = await somehowLoadData();

  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My Fresh app</title>
      </head>
      <body>
        <h1>Hello {data.name}</h1>
        <props.Component />
      </body>
    </html>
  );
});
```

## Disabling the app wrapper

Rendering the app wrapper can be skipped on a route or layout basis. To do that,
set `skipAppWrapper: true` to the layout or route config.

```tsx routes/my-special-route.tsx
import { RouteConfig } from "fresh";

export const config: RouteConfig = {
  skipAppWrapper: true, // Skip the app wrapper during rendering
};

export default define.page(function Page() {
  // ...
});
```
