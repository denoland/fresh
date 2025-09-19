# @fresh/test-utils

Internal shared testing utilities for the Fresh monorepo.

- Not published externally
- Import via the workspace alias: `@fresh/test-utils`
- Provides common helpers for browser/E2E, DOM assertions, temp files/dirs,
  child process servers, and lightweight server/middleware testing

## What’s included

These modules are re-exported from `src/mod.ts` and can be imported directly
from `@fresh/test-utils`.

### Browser

- `withBrowser(fn)` — Launch a headless browser page and run assertions. Dumps
  page HTML on failure.
- `withBrowserApp(appOrHandler, fn)` — Serve a Fresh app or `Deno.ServeHandler`
  on an ephemeral port and open a page.
  - Accepts either an `app` with a `handler()` method or a raw
    `Deno.ServeHandler`.

### DOM

- `parseHtml(html)` — Parse HTML into a `Document` with `.debug()`
  pretty-printer.
- `assertSelector(doc, selector)` — Assert a selector exists and show a pretty
  DOM on failure.
- `assertNotSelector(doc, selector)` — Assert a selector does not exist.
- `waitForText(page, selector, text)` — Wait until a selector’s textContent
  equals the expected value.
- `assertMetaContent(doc, nameOrProperty, expected)` — Assert a `<meta>` tag by
  `name` or `property` has `content`.

### FS

- `withTmpDir(options?)` — Create a temp dir and auto-clean it up on dispose.
- `writeFiles(dir, files)` — Write multiple files, creating parent directories.
- `updateFile(path, fn)` — Update a file’s text, returning an async disposable
  that restores the original.

### Process

- `withChildProcessServer(options, fn)` — Spawn a Deno command and wait until an
  address appears in stdout/stderr, then call `fn(address)` and clean up.
- `getStdOutput(out)` — Decode stdout/stderr from `Deno.CommandOutput` without
  ANSI escapes.

### Server

- `FakeServer(handler)` — Call your handler directly via
  `get/post/put/patch/delete/head/options` helpers.
- `serveMiddleware(mw, options)` — Wrap a Fresh middleware and call it with a
  built `Context`.
- `MockBuildCache(files, mode)` — Minimal `BuildCache` for middleware tests.
- `createFakeFs(files)` — Tiny fake FS for internal build/middleware unit tests.

### Util

- `waitFor(cond, timeoutMs?)` — Poll a condition until true or timeout.
- `usingEnv(vars, fn)` — Temporarily set env vars for the duration of `fn`.

## Examples

Import helpers from the alias:

```ts
import {
  assertMetaContent,
  parseHtml,
  withBrowserApp,
} from "@fresh/test-utils";

await withBrowserApp(app.handler(), async (page, address) => {
  await page.goto(address);
  const doc = parseHtml(await page.content());
  assertMetaContent(doc, "description", "Fresh site");
});
```

Temporarily modify a file during a test:

```ts
import { updateFile } from "@fresh/test-utils";

await using _ = await updateFile(
  "./vite.config.ts",
  (txt) => txt.replace("fresh()", "fresh({ devInspector: true })"),
);
// run assertions that depend on the modified config...
```

## Notes

- This package is internal to the monorepo and imports some Fresh internals by
  path for testing utilities. That’s intentional.
- Keep package-specific helpers (like full build flows or fixture copying) in
  their package tests; add only generic reusable bits here.
