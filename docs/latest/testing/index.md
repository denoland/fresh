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

## Testing routes and handlers

For testing your route handlers and business logic, you can use the same
[`App`](/docs/concepts/app) pattern shown above. Fresh 2.0 makes it easy to test
individual routes without needing a full build process:

```ts my-routes.test.ts
import { expect } from "@std/expect";
import { App } from "fresh";

// Import your route handlers
import { handler as indexHandler } from "./routes/index.ts";
import { handler as apiHandler } from "./routes/api/users.ts";

Deno.test("Index route returns homepage", async () => {
  const app = new App().get("/", indexHandler);
  const handler = app.handler();

  const response = await handler(new Request("http://localhost/"));
  const text = await response.text();

  expect(text).toContain("Welcome");
});

Deno.test("API route returns JSON", async () => {
  const app = new App().get("/api/users", apiHandler);
  const handler = app.handler();

  const response = await handler(new Request("http://localhost/api/users"));
  const json = await response.json();

  expect(json).toEqual({ users: [] });
});
```

## Testing islands

Testing islands requires different approaches for server-side and client-side
behavior:

### Server-side rendering of islands

You can test that your islands render correctly on the server using the same
[`App`](/docs/concepts/app) pattern:

```ts island-ssr.test.ts
import { expect } from "@std/expect";
import { App } from "fresh";
import { handler as pageHandler } from "./routes/counter-page.tsx";

Deno.test("Counter page renders island", async () => {
  const app = new App().get("/counter", pageHandler);
  const handler = app.handler();

  const response = await handler(new Request("http://localhost/counter"));
  const html = await response.text();

  // Verify the island's initial HTML is present
  expect(html).toContain('class="counter"');
  expect(html).toContain("count: 0");
});
```

### Client-side island interactivity

For testing client-side island behavior (clicks, state changes, etc.), you need
a full build and browser environment. You can use the approach similar to
Fresh's own tests:

```ts island-client.test.ts
import { expect } from "@std/expect";
import { createBuilder } from "vite";
import { withBrowser } from "@std/testing/browser";
import * as path from "@std/path";

// Create a production build
const builder = await createBuilder({
  logLevel: "error",
  root: "./",
  build: { emptyOutDir: true },
  environments: {
    ssr: { build: { outDir: path.join("_fresh", "server") } },
    client: { build: { outDir: path.join("_fresh", "client") } },
  },
});
await builder.buildApp();

const { app } = await import("./_fresh/server.js");

Deno.test("Counter island is interactive", async () => {
  // Start production server
  const server = Deno.serve({
    port: 0,
    handler: app.handler(),
  });

  const { port } = server.addr as Deno.NetAddr;
  const address = `http://localhost:${port}`;

  try {
    await withBrowser(async (page) => {
      await page.goto(`${address}/counter`, {
        waitUntil: "networkidle2",
      });

      // Wait for island to hydrate and become interactive
      await page.locator("button").wait();
      await page.textContent("button", { timeout: 5000 });

      // Test initial state
      const initialText = await page.textContent("button");
      expect(initialText).toContain("count: 0");

      // Test interactivity
      await page.locator("button").click();
      const updatedText = await page.textContent("button");
      expect(updatedText).toContain("count: 1");
    });
  } finally {
    await server.shutdown();
  }
});
```

**Note:** For most applications, testing the server-side rendering is
sufficient. Only test client-side interactivity if you have complex island logic
that needs verification.
