---
description: |
  Add a global app wrapper to provide common meta tags or context for application routes.
---

To ensure that your application works as expected we can write tests. Any aspect
of Fresh can be tested as a whole together or in isolation. We use Deno's
built-in [test runner](https://docs.deno.com/runtime/fundamentals/testing/) to
write tests.

## Testing middlewares

To test [middlewares](/docs/concepts/middleware) we're going to create a dummy
app and return the relevant info we want to check in a custom `/` handler.

```ts middleware.test.ts
import { expect } from "@std/expect";
import { App } from "fresh";

const middleware = define.middleware((ctx) => {
  ctx.state.text = "middleware text";
  return ctx.next();
});

Deno.test("My middleware - sets ctx.state.text", async () => {
  const handler = new App()
    .use(middleware)
    .get("/", (ctx) => new Response(ctx.state.text))
    .handler();

  const res = await handler(new Request("http://localhost"));
  const text = await res.text();

  expect(text).toEqual("middleware text");
});
```

You can extend this pattern for other middlewares. When you have a middleware
that adds a header to the returned response, you can assert against that too.

## Testing app wrapper or layouts

Both the [app wrapper](/docs/advanced/app-wrapper) component and
[layouts](/docs/advanced/layouts) can be tested in the same way.

```tsx routes/_app.test.tsx
import { expect } from "@std/expect";
import { App } from "fresh";

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

Deno.test("App Wrapper - renders title and content", async () => {
  const handler = new App()
    .appWrapper(AppWrapper)
    .get("/", (ctx) => ctx.render(<h1>hello</h1>))
    .handler();

  const res = await handler(new Request("http://localhost"));
  const text = await res.text();

  expect(text).toContain("My App");
  expect(text).toContain("Hello");
});
```

Same can be done for layouts.

```tsx routes/_layout.test.tsx
import { expect } from "@std/expect";
import { App } from "fresh";

function MyLayout({ Component }) {
  return (
    <div>
      <h1>My Layout</h1>
      <Component />
    </div>
  );
}

Deno.test("MyLayout - renders heading and content", async () => {
  const handler = new App()
    .layout("*", MyLayout)
    .get("/", (ctx) => ctx.render(<h1>hello</h1>))
    .handler();

  const res = await handler(new Request("http://localhost"));
  const text = await res.text();

  expect(text).toContain("My Layout");
  expect(text).toContain("Hello");
});
```

## Testing with file routes and islands

[File routes](/docs/concepts/file-routing) are collected by the
[`Builder`](/docs/advanced/builder) class and not just by
[`App`](/docs/concepts/app) alone. We can generate a snapshot and re-use it for
many app instances in our test suite.

```ts my-app.test.ts
import { createBuilder } from "vite";
// Best to do this once instead of for every test case for
// performance reasons.
const builder = await createBuilder({
  root: "./path/to/app",
  build: {
    emptyOutDir: true,
  },
});
await builder.build();

const { app } = await import("./path/to/app/.fresh/server.js");

Deno.test("My Test", async () => {
  const handler = app.handler();

  const response = await handler(new Request("http://localhost"));
  const text = await response.text();

  if (text !== "hello") {
    throw new Error("fail");
  }
});
```
