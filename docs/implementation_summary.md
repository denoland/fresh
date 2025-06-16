# Path-Specific Middleware Implementation Complete

The implementation of path-specific middleware is now complete. Here's a summary
of the changes made:

## 1. Router Interface Updates

The `Router` interface has been updated to support path-specific middleware:

```typescript
export interface Router<T> {
  _routes: Route<T>[];
  _middlewares: Array<{ path: string | URLPattern; handlers: T[] }>; // Changed from T[]
  addMiddleware(path: string | URLPattern, handlers: T[]): void; // Changed signature
  // ... other methods remain the same
}
```

## 2. UrlPatternRouter Implementation

The `UrlPatternRouter` class has been updated to:

- Store middleware with their associated paths
- Match requests against middleware paths during routing
- Only apply middleware whose paths match the current request URL
- Extract parameters from matched URL patterns

## 3. App Class Changes

The `App` class now provides an overloaded `use()` method that accepts either:

1. One or more middleware functions (global application)
2. A path string followed by one or more middleware functions (path-specific
   application)

```typescript
// Global middleware
app.use(async (ctx, next) => {
  console.log("All requests");
  return await next();
});

// Path-specific middleware
app.use("/api/*", async (ctx, next) => {
  console.log("API requests only");
  return await next();
});
```

## 4. Documentation

The Fresh documentation has been updated to include information about
path-specific middleware:

- Added sections to the middleware concept documentation explaining programmatic
  middleware
- Added examples showing how to use path-specific middleware
- Updated API reference to reflect the new functionality

## 5. Example Code

An example file has been created at `examples/src/middleware_example.ts` that
demonstrates:

- Global middleware
- Path-specific middleware
- Multiple middleware functions for a path
- Middleware for routes with URL parameters

## Usage

To use path-specific middleware in your Fresh application:

```typescript
import { App } from "$fresh/server.ts";

const app = new App();

// Global middleware (applies to all paths)
app.use(async (ctx, next) => {
  console.log(`Request: ${ctx.url.pathname}`);
  return await next();
});

// Path-specific middleware (only applies to matching paths)
app.use("/api/*", async (ctx, next) => {
  // This only runs for API routes
  const response = await next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
});

// Multiple middleware for a specific path
app.use("/auth/*", // First middleware
async (ctx, next) => {
  if (!ctx.request.headers.has("Authorization")) {
    return new Response("Unauthorized", { status: 401 });
  }
  return await next();
}, // Second middleware
async (ctx, next) => {
  console.log("Auth request");
  return await next();
});

// Path with parameters
app.use("/users/:id", async (ctx, next) => {
  console.log(`User ID: ${ctx.params.id}`);
  return await next();
});

await app.listen({ port: 8000 });
```
