---
description: |
  Migration guide for Fresh 2.x
---

We tried to keep breaking changes in Fresh 2 as minimal as possible, but some
changes need to be updated manually. Fresh 2 comes with many quality of life
[improvements](https://deno.com/blog/an-update-on-fresh) that make it easier to
extend and adapt Fresh. We've created this upgrade guide as part of upgrading
our own apps here at Deno.

Use this guide to migrate a Fresh 1.x app to Fresh 2.

## Applying automatic updates

Most changes can be applied automatically with the update script. Start the
update by running it in your project directory:

```sh
deno run -Ar jsr:@fresh/update
```

This will apply most API changes made in Fresh 2 automatically update like
changing `$fresh/server.ts` imports to `fresh`.

## Getting `main.ts` and `dev.ts` ready

Configuring Fresh doesn't require a dedicated config file anymore. You can
delete the `fresh.config.ts` file. The `fresh.gen.ts` manifest file isn't needed
anymore either.

```diff
  routes/
  dev.ts
- fresh.gen.ts
- fresh.config.ts
  main.ts
```

Fresh 2 takes great care in ensuring that code that's only needed during
development is separate from production code. This split makes deployments much
smaller, quicker to upload and allows them to boot up much quicker in
production.

### Updating `dev.ts`

Development related configuration can be passed to the `Builder` class instance
in `dev.ts`. This file is also where you typically set up development-only
plugins like [tailwindcss](https://tailwindcss.com/).

The full `dev.ts` file for newly generated Fresh 2 projects looks like this:

```ts
import { Builder } from "fresh/dev";
import { tailwind } from "@fresh/plugin-tailwind";

// Pass development only configuration here
const builder = new Builder({ target: "safari12" });

// Example: Enabling the tailwind plugin for Fresh
tailwind(builder);

// Create optimized assets for the browser when
// running `deno run -A dev.ts build`
if (Deno.args.includes("build")) {
  await builder.build();
} else {
  // ...otherwise start the development server
  await builder.listen(() => import("./main.ts"));
}
```

### Updating `main.ts`

Similarly, configuration related to running Fresh in production can be passed to
`new App()`:

```ts
// main.ts
import { App, fsRoutes, staticFiles } from "fresh";

export const app = new App()
  // Add static file serving middleware
  .use(staticFiles())
  // Enable file-system based routing
  .fsRoutes();
```

## Merging error pages

Both the `_500.tsx` and `_404.tsx` template have been unified into a single
`_error.tsx` template.

```diff
  routes/
-   ├── _404.tsx
-   ├── _500.tsx
+   ├── _error.tsx
    └── ...
```

Inside the `_error.tsx` template you can show different content based on errors
or status codes with the following code:

```tsx
export default function ErrorPage(props: PageProps) {
  const error = props.error; // Contains the thrown Error or HTTPError
  if (error instanceof HttpError) {
    const status = error.status; // HTTP status code

    // Render a 404 not found page
    if (status === 404) {
      return <h1>404 - Page not found</h1>;
    }
  }

  return <h1>Oh no...</h1>;
}
```

## Removal of `<Head>` component

The `<Head>` component was used in Fresh 1.x to add additional tags to the
`<head>` portion of an HTML document from anywhere on the page. This feature was
removed in preparation and due to performance concerns as it required a complex
machinery in the background to work.

Instead, passing head-related data is best done via `ctx.state`

```tsx
// about.tsx
export const handler = {
  GET(ctx) {
    // Set a route specific data in a handler
    ctx.state.title = "About Me";
    return page();
  },
};

// Render that in _app.tsx
export default function AppWrapper(ctx: FreshContext) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {ctx.state.title ? <title>{ctx.state.title}</title> : null}
      </head>
      <body>
        <ctx.Component />
      </body>
    </html>
  );
}
```

## Update deployment settings

Fresh 2 requires assets to be build during deployment instead of building them
on demand. Run the `deno task build` command as part of your deployment process.
If you have already set up Fresh's 1.x "Ahead-of-Time Builds", then no changes
are necessary.

## Trailing slash handling

The handling trailing slashes has been extracted to an optional middleware that
you can add if needed. This middleware can be used to ensure that URLs always
have a trailing slash at the end or that they will never have one.

```diff
-  import { App, staticFiles } from "fresh";
+  import { App, staticFiles, trailingSlashes } from "fresh";

  export const app = new App({ root: import.meta.url })
    .use(staticFiles())
+   .use(trailingSlashes("never"));
```

## Automatic updates

> [info]: The changes listed here are applied automatically when running the
> [`@fresh/update`](https://jsr.io/@fresh/update) script and you shouldn't need
> to have to do these yourself.

### Unified middleware signatures

Middleware, handler and route component signatures have been unified to all look
the same. Instead of receiving two arguments, they receive one. The `Request`
object is stored on the context object as `ctx.req`.

```diff
- const middleware = (req, ctx) => new Response("ok");
+ const middleware = (ctx) => new Response("ok");
```

Same is true for handlers:

```diff
  export const handler = {
-   GET(req, ctx) {
+   GET(ctx) {
      return new Response("ok");
    },
  };
```

...and async route components:

```diff
-  export default async function MyPage(req: Request, ctx: RouteContext) {
+  export default async function MyPage(props: PageProps) {
    const value = await loadFooValue();
    return <p>foo is: {value}</p>;
  }
```

All the various context interfaces have been consolidated and simplified:

| Fresh 1.x                                     | Fresh 2.x                                  |
| --------------------------------------------- | ------------------------------------------ |
| `AppContext`, `LayoutContext`, `RouteContext` | [`Context`](/docs/canary/concepts/context) |

### Context methods

The `ctx.renderNotFound()` method has been removed in favor of throwing an
`HttpError` instance. This allows all middlewares to optionally participate in
error handling. Other properties have been moved or renamed to make it easier to
re-use existing objects internally as a minor performance optimization.

| Fresh 1.x              | Fresh 2.x                  |
| ---------------------- | -------------------------- |
| `ctx.renderNotFound()` | `throw new HttpError(404)` |
| `ctx.basePath`         | `ctx.config.basePath`      |
| `ctx.remoteAddr`       | `ctx.info.remoteAddr`      |

## Getting help

If you run into problems with upgrading your app, reach out to us by creating an
issue here https://github.com/denoland/fresh/issues/new . That way we can
improve this migration guide for everyone.
