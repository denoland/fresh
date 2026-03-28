---
description: |
  Quick reference for all public exports from Fresh's entry points: fresh, fresh/runtime, and fresh/dev.
---

This page lists all public exports from Fresh's entry points.

## `fresh`

The main entry point for server-side code.

```ts
import { App, createDefine, HttpError, page, staticFiles } from "fresh";
```

| Export            | Kind     | Description                                                                                        |
| ----------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `App`             | Class    | The main application class. See [App](/docs/concepts/app).                                         |
| `staticFiles`     | Function | Middleware for serving static files. See [Static Files](/docs/concepts/static-files).              |
| `createDefine`    | Function | Create type-safe `define.*` helpers. See [Define Helpers](/docs/advanced/define).                  |
| `page`            | Function | Return data from a handler to a page component. See [Data Fetching](/docs/concepts/data-fetching). |
| `HttpError`       | Class    | Throw HTTP errors with status codes. See [Error Handling](/docs/advanced/error-handling).          |
| `cors`            | Function | CORS middleware. See [cors](/docs/plugins/cors).                                                   |
| `csrf`            | Function | CSRF protection middleware. See [csrf](/docs/plugins/csrf).                                        |
| `csp`             | Function | Content Security Policy middleware. See [csp](/docs/plugins/csp).                                  |
| `trailingSlashes` | Function | Trailing slash enforcement middleware. See [trailingSlashes](/docs/plugins/trailing-slashes).      |

**Types:**

| Export                                | Description                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `Context` / `FreshContext`            | The request context passed to all middlewares and handlers.                          |
| `PageProps`                           | Props received by page components (includes `data`, `url`, `params`, `state`, etc.). |
| `Middleware` / `MiddlewareFn`         | Middleware function type.                                                            |
| `HandlerFn`                           | Single handler function type.                                                        |
| `HandlerByMethod`                     | Object with per-method handler functions.                                            |
| `RouteHandler`                        | Union of `HandlerFn` and `HandlerByMethod`.                                          |
| `PageResponse`                        | Return type of `page()`.                                                             |
| `RouteConfig`                         | Route configuration (`routeOverride`, `skipInheritedLayouts`, etc.).                 |
| `LayoutConfig`                        | Layout configuration (`skipInheritedLayouts`, `skipAppWrapper`).                     |
| `Define`                              | Type of the object returned by `createDefine()`.                                     |
| `FreshConfig` / `ResolvedFreshConfig` | App configuration types.                                                             |
| `ListenOptions`                       | Options for `app.listen()`.                                                          |
| `Island`                              | Island component type.                                                               |
| `Method`                              | HTTP method union type.                                                              |
| `CORSOptions`                         | Options for `cors()`.                                                                |
| `CsrfOptions`                         | Options for `csrf()`.                                                                |
| `CSPOptions`                          | Options for `csp()`.                                                                 |

## `fresh/runtime`

Shared runtime utilities for both server and client code. Safe to import in
islands.

```ts
import {
  asset,
  assetSrcSet,
  Head,
  HttpError,
  IS_BROWSER,
  Partial,
} from "fresh/runtime";
```

| Export        | Kind      | Description                                                                                    |
| ------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `IS_BROWSER`  | Constant  | `true` in the browser, `false` on the server. Use to guard browser-only code.                  |
| `asset`       | Function  | Add cache-busting query params to asset URLs. See [Static Files](/docs/concepts/static-files). |
| `assetSrcSet` | Function  | Apply `asset()` to all URLs in a `srcset` string.                                              |
| `Partial`     | Component | Mark a region for partial updates. See [Partials](/docs/advanced/partials).                    |
| `Head`        | Component | Add elements to the document `<head>`. See [Modifying head](/docs/advanced/head).              |
| `HttpError`   | Class     | HTTP error class (re-exported from `fresh`).                                                   |

## `fresh/dev`

Development and build tools. Only used in `dev.ts` (legacy) or build scripts.

```ts
import { Builder } from "fresh/dev";
```

| Export    | Kind  | Description                                                            |
| --------- | ----- | ---------------------------------------------------------------------- |
| `Builder` | Class | Pre-Vite build system (legacy). See [Builder](/docs/advanced/builder). |

**Types:**

| Export                                                   | Description                  |
| -------------------------------------------------------- | ---------------------------- |
| `BuildOptions`                                           | Options for `new Builder()`. |
| `OnTransformArgs` / `OnTransformOptions` / `TransformFn` | Build plugin hook types.     |
