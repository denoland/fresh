---
description: |
  Learn how to test your Fresh contributions.
---

# Testing Changes

## Running Tests

Before submitting a pull request, run the full check suite:

```sh Terminal
deno task ok
```

This runs `deno fmt --check`, `deno lint`, type checking, and the test suite.

To run tests individually:

```sh Terminal
# All tests (parallel)
deno task test

# A specific test file
deno test -A packages/fresh/src/app_test.ts

# Filter by test name
deno test -A --filter "test name pattern"
```

## Test Organization

Tests use Deno's built-in test framework with `@std/expect` for assertions. Test
files follow the `*_test.ts` naming convention and live alongside the source
code they test. Snapshot tests are stored in `__snapshots__/` directories.

All tests require the `-A` (all permissions) flag.

## What to Test

**Core framework changes** (`packages/fresh/`): Run the package tests and verify
with the docs site (`deno task www`) or the demo app (`deno task demo`).

**Vite plugin changes** (`packages/plugin-vite/`): Test both dev and production
modes:

```sh Terminal
deno task demo          # dev mode
deno task demo:build    # production build
deno task demo:start    # serve production build
```

**Updating snapshots**: If your changes intentionally alter test output:

```sh Terminal
deno test -A --update-snapshots path/to/test.ts
```

## Known Local Test Issues

Some tests may fail locally but pass in CI. These can be safely ignored:

- `Could not find server address`
- `Text file busy (os error 26)`
