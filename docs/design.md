# Path-Specific Middleware Design for Fresh

## Overview

This document outlines the design for adding path-specific middleware support to
Fresh. The goal is to enhance the middleware system to allow middleware
functions to be applied only to specific URL paths, while maintaining the
simplicity and elegance of Fresh's API.

## Current Implementation

Currently, Fresh supports global middleware via the `use()` method:

```typescript
app.use(async (ctx, next) => {
  // This middleware runs for ALL requests
  return await next();
});
```

Middleware is stored in a flat array in the `UrlPatternRouter` class, and all
middleware is applied to every request, regardless of the URL path.

## Proposed Design

We will extend the middleware system to support path-specific middleware while
keeping the existing `use()` method as the single entry point for registering
middleware:

```typescript
// Global middleware (applied to all paths)
app.use(async (ctx, next) => {
  console.log("Global middleware");
  return await next();
});

// Path-specific middleware (only applied to matching paths)
app.use("/api/*", async (ctx, next) => {
  console.log("API middleware");
  return await next();
});
```

### Key Design Decisions

1. **Single Method Interface**: Use only the `use()` method with an optional
   path parameter.
2. **Default Path**: If no path is provided, the middleware is applied to all
   routes (equivalent to path `"/*"`).
3. **Path Matching**: Support both exact string paths and pattern matching using
   the existing `URLPattern` API.
4. **Middleware Order**: Maintain the execution order of middleware as they are
   registered.

## Implementation Details

### Router Interface Updates

The `Router` interface will be updated to store middleware with associated
paths:

```typescript
export interface Router<T> {
  _routes: Route<T>[];
  _middlewares: Array<{ path: string | URLPattern; handlers: T[] }>; // Changed from T[]
  addMiddleware(path: string | URLPattern, handlers: T[]): void; // Changed signature
  // ... other methods remain the same
}
```

### UrlPatternRouter Implementation

The `UrlPatternRouter` class will be updated to:

1. Store middleware with their associated paths
2. Match requests against middleware paths during routing
3. Only apply middleware whose paths match the current request URL

### App Class Changes

The `App` class will provide an overloaded `use()` method that accepts either:

1. One or more middleware functions (global application)
2. A path string followed by one or more middleware functions (path-specific
   application)

## API Examples

```typescript
const app = new App();

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

// Multiple middleware for a specific path
app.use("/auth/*", async (ctx, next) => {
  // First auth middleware
  return await next();
}, async (ctx, next) => {
  // Second auth middleware
  return await next();
});
```

## Backwards Compatibility

This design maintains backward compatibility with existing code:

- Existing calls to `app.use(middleware)` will continue to work as before
- The middleware execution flow is preserved
- No changes to existing middleware functions are required

## Performance Considerations

- Path matching adds a small overhead to request processing
- For applications with many middleware functions, we should optimize the path
  matching process
- We could explore caching matched middleware for common paths

## Future Extensions

Future iterations could include:

- Method-specific middleware (e.g., apply only to GET requests)
- Priority levels for middleware execution order
- Conditional middleware application based on other request properties
