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

There is also a possibility to modify the document template by using special
tags `html`, `Head` or `body`. This can be done in any other Preact component,
but using it in the application wrapper lets you define one common document
template.

```tsx
// routes/_app.tsx

import { asset, Head } from "$fresh/runtime.ts";
import { AppProps } from "$fresh/src/server/types.ts";

export default function App({ Component }: AppProps) {
  return (
    <html data-custom="data">
      <Head>
        <title>Fresh</title>
        <link rel="stylesheet" href={asset("style.css")} />
      </Head>
      <body class="bodyClass">
        <Component />
      </body>
    </html>
  );
}
```

Currently, there is no way of overriding default tags/attributes from provided
template.
