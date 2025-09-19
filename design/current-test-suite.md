# Analysis of the Current Test Suite

This document provides a detailed analysis of the existing test suite in the
Fresh repository. It outlines the architecture, identifies key problem areas,
and serves as a foundation for the proposed rewrite.

## 1. Overview

The test suite is spread across multiple packages, primarily `packages/fresh`
and `packages/plugin-vite`. It uses a combination of Deno's built-in test runner
(`Deno.test`), the standard library's `asserts` module, and a collection of
custom utility functions.

The core of the testing strategy revolves around:

- **Fixture-based testing:** Small, self-contained Fresh projects (`fixtures`)
  are used to test specific features.
- **Child process execution:** Tests often spawn a Deno process to run a
  development server (`deno run ... main.ts`).
- **E2E and DOM inspection:** A headless browser (`@astral/astral`) or a virtual
  DOM (`linkedom`) is used to interact with the running server and assert the
  state of the rendered HTML.

## 2. Key Files and Components

- Internal test utilities (canonical source):
  - `@fresh/internal/test-utils` (from `packages/internal/src/*`)
    - Provides shared helpers used across the monorepo:
      - Browser helpers: `withBrowser`, `withBrowserApp`
      - DOM helpers: `parseHtml`, `assertSelector`, `assertNotSelector`, `assertMetaContent`
      - Process helpers: `withChildProcessServer`, `getStdOutput`
      - Server helpers: `FakeServer`, `serveMiddleware`, `MockBuildCache`, `createFakeFs`
      - FS helpers: `withTmpDir`, `writeFiles`, `delay`, `updateFile`
      - Misc: `waitFor`, `usingEnv`
  - `@fresh/internal/versions`
    - Centralized version constants used in tests/docs.

- `packages/fresh/tests/test_utils.tsx`: Now only contains Fresh-specific test bits:
  - JSX-based helpers used within Fresh tests (`Doc`, `charset`, `favicon`).
  - Build and fixtures helpers (`buildProd`, `ALL_ISLAND_DIR`, `ISLAND_GROUP_DIR`).
  - All generic utilities were removed and should be imported from `@fresh/internal/test-utils`.

- `packages/plugin-vite/tests/test_utils.ts`: Thin wrappers for plugin-vite:
  - Uses `@fresh/internal/test-utils` primitives under the hood.
  - Adds Vite-specific helpers like `prepareDevServer`, `launchDevServer`, `spawnDevServer`, and `buildVite`.

- **Fixture Directories**:
  - `packages/fresh/tests/fixtures_islands/`
  - `packages/fresh/tests/fixture_island_groups/`
  - `packages/plugin-vite/tests/fixtures/`
  - These contain the small Fresh projects that are run during tests.

## 3. Problematic Areas (pre-refactor)

### 3.1. Temporary Directory Management

- **The Problem:** The `prepareDevServer` function in
  `plugin-vite/tests/test_utils.ts` calls `withTmpDir` from
  `fresh/src/test_utils.ts`. The `withTmpDir` function is configured to create
  temporary directories with a prefix like `tmp_vite_` **inside the
  `packages/plugin-vite` directory itself**.
- **Impact:** This pollutes the project's source tree with temporary test
  artifacts. This is messy for local development and can cause issues in CI
  environments, as untracked files may be present during builds or other steps.
  It also makes it harder to reason about the state of the repository. The user
  has noted that moving this outside the repository breaks things due to path
  dependencies (e.g., finding `deno.json`), indicating a tight coupling between
  the test fixtures and the repository root.

### 3.2. Redundant and Convoluted Logic

- **The Problem:** There is significant overlap in the logic for starting a
  server. `fresh` has `withChildProcessServer`, and `plugin-vite` has
  `launchDevServer` and `spawnDevServer`, which are wrappers around
  `withChildProcessServer`. This creates a confusing, multi-layered system.
- **Impact:** It's difficult for a developer to understand the exact sequence of
  events when a test is run. Debugging is complicated because the root cause of
  a failure could be in any of the layers of abstraction. The separation of
  concerns is unclear.

### 3.3. Brittle Server Readiness Check

- **The Problem:** The `withChildProcessServer` function determines if the
  server is ready by reading the process's `stdout` line by line and looking for
  a URL (`http://...`).
- **Impact:** This is extremely fragile. It can fail if:
  - The server's startup log message changes.
  - The output is buffered differently across OSes or Deno versions.
  - The log output is colored or contains other ANSI escape codes (though
    `stripAnsiCode` is used, it's an extra step that can fail).
  - The server logs an unrelated URL before it's actually ready to accept
    connections.
- This is a likely source of the test flakiness observed across different
  environments.

### 3.4. Cross-Package Dependencies

- Pre-refactor, `plugin-vite` imported helpers from `fresh/tests/test_utils.tsx`.
  This tight coupling has been removed by introducing `@fresh/internal/test-utils`.

### 3.5. JSX in Utility Files

- Generic utilities were moved out into `@fresh/internal/test-utils`.
  The remaining `.tsx` file is intentionally limited to JSX-only test helpers
  used by the Fresh tests (e.g., `Doc`, `favicon`).

### 3.6. Lack of Abstraction

- **The Problem:** The primitives of the test suite (creating a temporary
  fixture, starting a server, running an E2E test) are not well-abstracted. They
  are implemented as a series of standalone functions that are chained together
  within the test files themselves.
- **Impact:** This leads to boilerplate code in the test files and makes it
  difficult to see the "what" (the test's intent) because of all the "how" (the
  setup and teardown mechanics).

## 4. Current State (post-refactor)

- Shared, generic test utilities live in `@fresh/internal/test-utils` inside
  `packages/internal`. They are allowed to import Fresh internals as needed.
- Fresh-specific JSX helpers remain in `packages/fresh/tests/test_utils.tsx`.
- `packages/fresh/src/test_utils.ts` has been removed; runtime code no longer
  imports test utilities. Where a fallback is needed (e.g., in `app.ts`), an
  inline minimal `BuildCache` is used.
- `plugin-vite` tests consume shared primitives from `@fresh/internal/test-utils`
  and wrap them with Vite-specific helpers where appropriate.

This layout removes cross-package coupling, eliminates duplicated helpers, and
keeps the repo green under `deno lint` and `deno check`.
