# Proposal for a New Test Suite Architecture

This document outlines a plan to refactor the Fresh test suite to address the
problems identified in the analysis document. The goal is to create a robust,
maintainable, and easy-to-understand testing framework.

## 1. Guiding Principles

- **Centralization:** Shared testing logic should live in one place.
- **Abstraction:** Hide implementation details, expose clear intent.
- **Robustness:** Eliminate fragile patterns like stdout scraping.
- **Isolation:** Packages should not have test-level dependencies on each other.
- **Clarity:** Code should be easy to read and reason about.

## 2. The `internal` Package

I will create a new package at `packages/internal`. This package will **not** be
published to `deno.land/x` and will serve as a centralized home for all shared
testing utilities.

### 2.1. Directory Structure

```
packages/
└── internal/
    ├── deno.json
    ├── README.md
    ├── src/
    │   ├── server.ts       # Test server management class (TestServer)
    │   ├── fixture.ts      # Fixture management utilities
    │   ├── browser.ts      # Headless browser utilities
    │   └── asserts.ts      # Common assertions (DOM, etc.)
    └── fixtures/           # (Optional) Truly shared test fixtures
```

### 2.2. Dependencies

The `deno.json` for `packages/internal` will explicitly list all testing-related
dependencies (`@astral/astral`, `linkedom`, `@std/expect`, etc.). Other packages
will then have a development-only dependency on the `internal` package via a
`file:` reference in their `deno.json`.

## 3. Core Abstractions

Instead of a collection of disconnected functions, we will introduce classes and
well-defined interfaces to manage the testing lifecycle.

### 3.1. `TestServer` Class (`packages/internal/src/server.ts`)

This class will be the cornerstone of the new architecture. It will encapsulate
all the logic related to starting, managing, and stopping a test server.

**Proposed `TestServer` API:**

```typescript
interface TestServerOptions {
  fixture: string; // Path to the fixture directory
  // ... other options like env vars
}

class TestServer implements AsyncDisposable {
  readonly address: string; // The server's base URL
  readonly projectRoot: string; // The temporary directory for the fixture

  constructor(options: TestServerOptions);

  static async create(options: TestServerOptions): Promise<TestServer>;

  // For simple fetch-based tests
  fetch(path: string, init?: RequestInit): Promise<Response>;

  // For E2E tests
  async withPage(fn: (page: Page) => Promise<void>): Promise<void>;

  // To stop the server
  async [Symbol.asyncDispose](): Promise<void>;
}
```

**Key Improvements:**

1. **Robust Readiness Check:** The `TestServer.create` factory method will
   implement a robust health-check loop. It will repeatedly attempt to `fetch` a
   well-known endpoint (e.g., `/`) on the server until it receives a successful
   response or times out. This completely eliminates the fragile stdout
   scraping.
2. **Unified Interface:** It provides a single, clear entry point for running
   any kind of test against a server, whether it's a simple `fetch` or a
   full-blown browser test.
3. **Resource Management:** By implementing `AsyncDisposable`, we can use the
   `await using` syntax in tests to guarantee that the server process and
   temporary directories are cleaned up, even if the test fails.

### 3.2. Fixture Management (`packages/internal/src/fixture.ts`)

This module will handle the creation and management of temporary project
directories for tests.

**The Temporary Directory Problem:**

The core issue is that fixtures need access to the root `deno.json` and
potentially other files to resolve dependencies correctly. Simply copying a
fixture to `/tmp` breaks these relative paths.

**Proposed Solution:**

1. **Default to OS Temp:** The new `createTemporaryFixture` function will, by
   default, create temporary directories in the OS's standard temp location
   (e.g., `Deno.makeTempDir()`).
2. **Intelligent Copying/Symlinking:** To solve the dependency issue, the
   function will: a. Copy the specific fixture files (e.g., from
   `packages/plugin-vite/tests/fixtures/my-app`) into the temporary directory.
   b. Create a **symlink** from `deno.json` in the temporary directory back to
   the repository's root `deno.json`
   (`ln -s /path/to/repo/deno.json /tmp/test-123/deno.json`). c. This approach
   keeps the test environment isolated while ensuring that Deno's dependency
   resolution works as expected. We can extend this to symlink other necessary
   root-level files or directories if needed.

This strategy provides the best of both worlds: clean, isolated test runs
outside the project tree, without breaking the build tooling.

## 4. Refactoring Plan

1. **Phase 1: Create the `internal` Package**
   - Set up the directory structure for `packages/internal`.
   - Move all testing dependencies into its `deno.json`.
   - Create the initial `TestServer` class and fixture management utilities,
     implementing the robust health check and temporary directory strategies.

2. **Phase 2: Refactor `packages/plugin-vite` Tests**
   - Update `packages/plugin-vite/deno.json` to depend on the local `internal`
     package.
   - Rewrite `packages/plugin-vite/tests/test_utils.ts` to be a thin wrapper, if
     needed at all. Most logic should be imported directly from `internal`.
   - Refactor the actual tests (e.g., `dev_server_test.ts`) to use the new
     `TestServer` class (`await using server = await TestServer.create(...)`).
   - This will eliminate the cross-package import to `fresh` and the
     in-repository temporary folders.

3. **Phase 3: Refactor `packages/fresh` Tests**
   - Update `packages/fresh/deno.json` to depend on the `internal` package.
   - Delete `packages/fresh/tests/test_utils.tsx`.
   - Move any reusable, non-JSX utility functions (like `parseHtml`,
     `assertSelector`) to `packages/internal/src/asserts.ts`.
   - Move the JSX helper components (`Doc`, `favicon`) into a dedicated file
     within the `packages/fresh/tests` directory, but **not** a general-purpose
     utility file. They are specific to the tests that use them.
   - Refactor the tests (e.g., `islands_test.tsx`) to use the `TestServer` from
     the `internal` package.

4. **Phase 4: Fixture Consolidation**
   - Analyze all fixtures across all packages.
   - If any fixture is used by tests in more than one package, move it to
     `packages/internal/fixtures`.
   - Fixtures used only by a single package will remain in that package's test
     directory.

## 5. Conclusion

This plan systematically dismantles the current tangled test suite and replaces
it with a modern, centralized, and robust architecture. By introducing the
`internal` package and the `TestServer` abstraction, we can eliminate redundant
code, fix brittle implementation details, and make the entire testing process
easier to understand and maintain. The proposed solution for the temporary
directory problem provides a path to clean up the repository without breaking
the underlying build and dependency resolution mechanisms.
