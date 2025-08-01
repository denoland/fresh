---
description: |
  Add a global app wrapper to provide common meta tags or context for application routes.
---

The `App` class is the heart of Fresh and routes incoming requests to the
correct middlewares. This is where routes, middlewares, layouts and more are
defined.

```tsx main.ts
const app = new App()
  .use(staticFiles())
  .get("/", () => new Response("hello"))
  .get("/about", (ctx) => ctx.render(<h1>About me</h1>));

// Start server
app.listen();
```

All items are applied from top to bottom. This means that when you defined a
middleware _after_ a `.get()` handler, it won't be included.

```ts main.ts
const app = new App()
  .use((ctx) => {
    // Will be called for all middlewares
    return ctx.next();
  })
  .get("/", () => new Response("hello"))
  .use((ctx) => {
    // Will only be called for `/about
    return ctx.next();
  })
  .get("/about", (ctx) => ctx.render(<h1>About me</h1>));
```

## `.use()`

Add one or more [middlewares](/docs/canary/concepts/middleware). Middlewares are
matched left to right.

```ts
// Add a middleware at the root
app.use(async (ctx) => {
  console.log("my middleware");
  return await ctx.next();
});
```

You can also add multiple middlewares:

```ts
app.use(middleware1, middleware2, middleware3);
```

Adding middlewares at a specific path:

```ts
app.use("/foo/bar", middleware);
```

Middlewares can also be instantiated lazily:

```ts
app.use("/foo/bar", async () => {
  const mod = await import("./path/to/my/middleware.ts");
  return mod.default;
});
```

## `.get()`

Respond to a `GET` request with the specified middlewares.

```ts
app.get("/about", async (ctx) => {
  return new Response(`GET: ${ctx.url.pathname}`);
});
```

Respond with multiple middlewares:

```ts
app.get("/about", middleware1, middleware2, async (ctx) => {
  return new Response(`GET: ${ctx.url.pathname}`);
});
```

You can also pass lazy middlewares:

```ts
app.get("/about", async () => {
  const mod = await import("./middleware-or-handler.ts");
  return mod.default;
});
```

## `.post()`

Respond to a `POST` request with the specified middlewares.

```ts
app.post("/api/user/:id", async (ctx) => {
  await somehowCreateUser(ctx.params.id);
  return new Response(`User created`);
});
```

Respond with multiple middlewares:

```ts
app.post("/api/user/:id", middleware1, middleware2, async (ctx) => {
  await somehowCreateUser(ctx.params.id);
  return new Response(`User created`);
});
```

You can also pass lazy middlewares:

```ts
app.post("/api/user/:id", async () => {
  const mod = await import("./middleware-or-handler.ts");
  return mod.default;
});
```

## `.put()`

Respond to a `PUT` request with the specified middlewares.

```ts
app.put("/api/user/:id", async (ctx) => {
  await somehowSaveUser(ctx.params.id);
  return new Response(`Updated user`);
});
```

Respond with multiple middlewares:

```ts
app.put("/api/user/:id", middleware1, middleware2, async (ctx) => {
  await somehowSaveUser(ctx.params.id);
  return new Response(`Updated user`);
});
```

You can also pass lazy middlewares:

```ts
app.put("/api/user/:id", async () => {
  const mod = await import("./middleware-or-handler.ts");
  return mod.default;
});
```

## `.delete()`

Respond to a `DELETE` request with the specified middlewares.

```ts
app.delete("/api/user/:id", async (ctx) => {
  await somehowDeleteUser(ctx.params.id);
  return new Response(`User deleted`);
});
```

Respond with multiple middlewares:

```ts
app.delete("/api/user/:id", middleware1, middleware2, async (ctx) => {
  await somehowDeleteUser(ctx.params.id);
  return new Response(`User deleted`);
});
```

You can also pass lazy middlewares:

```ts
app.delete("/api/user/:id", async () => {
  const mod = await import("./middleware-or-handler.ts");
  return mod.default;
});
```

## `.head()`

Respond to a `HEAD` request with the specified middlewares.

```ts
app.head("/api/user/:id", async (ctx) => {
  return new Response(null, { status: 200 });
});
```

Respond with multiple middlewares:

```ts
app.head("/api/user/:id", middleware1, middleware2, async (ctx) => {
  return new Response(null, { status: 200 });
});
```

You can also pass lazy middlewares:

```ts
app.head("/api/user/:id", async () => {
  const mod = await import("./middleware-or-handler.ts");
  return mod.default;
});
```

## `.all()`

Respond to a request for all HTTP verbs with the specified middlewares.

```ts
app.all("/api/foo", async (ctx) => {
  return new Response("hehe");
});
```

Respond with multiple middlewares:

```ts
app.all("/api/foo", middleware1, middleware2, async (ctx) => {
  return new Response("hehe");
});
```

You can also pass lazy middlewares:

```ts
app.all("/api/foo", async () => {
  const mod = await import("./middleware-or-handler.ts");
  return mod.default;
});
```

## `.fsRoute()`

Injects all file-based routes, middlewares, layouts and error pages to the app
instance.

```ts
app.fsRoutes();
```

You can optionally pass a path where they should be mounted.

```ts
app.fsRoutes("/foo/bar");
```

> [info]: If possible, routes are lazily loaded. Routes that set a route config
> and set `routeOverride` in particular, are never lazily loaded as Fresh would
> need to load the file to get the route pattern.

## `.route()`

TODO

## `.appWrapper()`

Set the [App Wrapper](/docs/canary/advanced/app-wrapper) component. This is
where the outer HTML, typically up until the `<body>`-tag is rendered.

## `.layout()`

Set a [Layout](/docs/canary/advanced/layouts) component at the specified path.
The app wrapper component and prior layouts are inherited by default unless
opted out.

## `.onError()`

Set an error route or middleware that will be rendered when it catches an error.

Setting a middleware:

```ts
// top level error handler
app.onError("*", ctx => {
  return new Response(String(ctx.error), { status: 500 })
}))
```

Setting a route:

TODO

## `.notFound()`

Call this middleware or route whenever a HTTP 404 error is caught.

```ts
app.notFound(() => {
  return new Response("Not found", { status: 404 });
});
```

TODO: Route

## `.mountApp()`

TODO

## `.handler()`

Create a handler function out of your app. This is a function where you can pass
a [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) instance
to and receive a
[`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response).

```ts
const app = new App()
  .get("/", () => new Response("hello"));

const handler = app.handler();

const response = await handler(new Request("http://localhost"));
console.log(await response.text()); // Logs: "hello"
```

This functionality is often used during testing or to run Fresh inside other
frameworks.

## `.listen()`

Spawns a server and listens for incoming connections.

```ts
const app = new App()
  .get("/", () => new Response("hello"));

app.listen();
```

You can pass an options object to customize which port to listen on and other
aspects.

```ts
app.listen({ port: 4000 });
```
