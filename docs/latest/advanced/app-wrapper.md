---
description: |
  Add a global app wrapper to provide common meta tags or context for application routes.
---

The app wrapper component is a Preact component that represents the outer
structure of the HTML document, typically up until the `<body>`-tag. It is only
rendered on the server and never on the client. The passed `Component` value
represents the children of this component.

```tsx routes/_app.tsx
function AppWrapper({ Component }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>My App</title>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}

app.appWrapper(AppWrapper);
```

Every [`ctx.render()`](/docs/concepts/context#render-1) call will include the
app wrapper component by default, unless opted out.

Note that only one app wrapper component is supported per
[`App`](/docs/concepts/app) instance.
