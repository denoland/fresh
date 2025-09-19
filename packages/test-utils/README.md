# @fresh/test-utils

Internal shared testing utilities for the Fresh monorepo.

- Not published externally.
- Provides common helpers for browser/E2E tests, child process servers,
  fixtures, DOM assertions, and lightweight server/middleware testing.

Usage from tests in this monorepo:

```ts
import {
  parseHtml,
  withBrowser,
  withChildProcessServer,
} from "@fresh/test-utils";
```
