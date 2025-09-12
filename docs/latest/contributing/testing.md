---
description: |
  Learn how to test your Fresh contributions effectively.
---

# Testing Changes

This guide covers how to test your Fresh contributions to ensure they work
correctly and don't break existing functionality.

## Required Testing Before Submitting

Before submitting any pull request, you **must** run:

```sh Terminal
deno task ok
```

This essential command runs:

- **Format check** (`deno fmt --check`)
- **Linting** (`deno lint`)
- **Type checking** (`deno task check:types`)
- **Test suite** (`deno task test`)

All of these must pass for your PR to be accepted.

## Test Suite Overview

Fresh uses Deno's built-in testing framework with the following patterns:

- **Test files**: Follow `*_test.ts` naming convention
- **Snapshot tests**: Stored in `__snapshots__/` directories
- **Parallel execution**: Tests run with `--parallel` flag for speed
- **Permissions**: All tests require `-A` (all permissions) flag

### Running Tests

```sh Terminal
# Run all tests (required before submitting)
deno task test

# Run tests for a specific file
deno test -A packages/fresh/src/app_test.ts

# Run tests with coverage
deno test -A --coverage

# Run a single test case
deno test -A --filter "test name pattern"
```

### Known Local Test Issues

Some tests may fail when run locally but will pass in CI. These can be safely
ignored:

- `Could not find server address`
- `Text file busy (os error 26)`

These are environment-specific issues that don't indicate problems with your
changes.

## Testing Your Changes

### 1. Unit and Integration Tests

Add tests for new functionality in the same directory:

```ts my_feature_test.ts
import { assertEquals } from "@std/testing/asserts";
import { myNewFeature } from "./my_feature.ts";

Deno.test("myNewFeature should work correctly", () => {
  const result = myNewFeature("input");
  assertEquals(result, "expected output");
});
```

### 2. Documentation Website Testing

The Fresh documentation website (`www/`) uses local Fresh packages, making it an
excellent integration test:

```sh Terminal
# Start the documentation website
deno task www

# Build the documentation website
deno task build-www

# Test specific documentation features
deno task test:www
```

Changes to core Fresh functionality will be reflected immediately in the
documentation site.

### 3. Vite Plugin Testing

For changes to the Vite plugin (`packages/plugin-vite/`):

```sh Terminal
# Run the Vite plugin demo
deno task demo

# Build the demo to test production builds
deno task demo:build

# Start the built demo
deno task demo:start
```

### 4. Fresh Init Testing

Test the Fresh project scaffolding tool:

```sh Terminal
# Create a test project with default settings
deno run -A packages/init/src/mod.ts test-project

# Create a project with Tailwind
deno run -A packages/init/src/mod.ts test-project --tailwind

# Create a project with legacy builder
deno run -A packages/init/src/mod.ts test-project --builder
```

## Testing Workflows by Feature Area

### Core Framework Changes

1. **Run unit tests**: `deno test -A packages/fresh/src/`
2. **Test with documentation site**: `deno task www`
3. **Test with demo**: `deno task demo`
4. **Create external test project** using
   [local development setup](./local-development)

### Routing Changes

1. **Test file-system routing**: Create test routes in `www/routes/`
2. **Test dynamic routes**: Verify parameter extraction works
3. **Test middleware**: Check middleware execution order

### Islands and Client Code

1. **Test SSR rendering**: Ensure islands render on server
2. **Test hydration**: Verify client-side functionality
3. **Test in browser**: Manual testing with developer tools
4. **Check bundle size**: Ensure no unexpected bloat

### Build System Changes

1. **Test development mode**: `deno task demo`
2. **Test production builds**: `deno task demo:build && deno task demo:start`
3. **Test with external project**: Use `links` configuration
4. **Verify generated files**: Check `_fresh/` directory contents

## Testing Best Practices

### Writing Good Tests

```ts
// ✅ Good: Descriptive name and clear expectations
Deno.test("Context should parse URL parameters correctly", () => {
  const ctx = new Context(
    new Request("http://localhost/users/123"),
    new URL("http://localhost/users/123"),
    mockInfo,
    "/users/:id",
    { id: "123" },
    config,
    () => Promise.resolve(new Response()),
    buildCache,
  );

  assertEquals(ctx.params.id, "123");
});

// ❌ Avoid: Vague names and unclear purpose
Deno.test("test context", () => {
  // unclear what this tests
});
```

### Performance Testing

```sh Terminal
# Measure test execution time
time deno task test

# Profile memory usage during tests
deno test -A --inspect --inspect-wait packages/fresh/src/app_test.ts
```

### Testing Error Conditions

```ts
Deno.test("should handle missing route gracefully", async () => {
  const response = await handler(new Request("http://localhost/nonexistent"));
  assertEquals(response.status, 404);
});

Deno.test("should throw HttpError for invalid input", () => {
  assertThrows(
    () => validateInput(""),
    HttpError,
    "Input cannot be empty",
  );
});
```

## Snapshot Testing

Fresh uses snapshot testing for complex output validation:

```ts
import { assertSnapshot } from "@std/testing/snapshot";

Deno.test("should render component correctly", async (t) => {
  const html = await renderComponent();
  await assertSnapshot(t, html);
});
```

To update snapshots when output intentionally changes:

```sh Terminal
deno test -A --update-snapshots packages/fresh/src/render_test.ts
```

## Manual Testing Checklist

Before submitting your PR, manually verify:

- [ ] **Development server starts** without errors
- [ ] **Hot reload works** for your changes
- [ ] **Production build completes** successfully
- [ ] **Generated bundles are reasonable** in size
- [ ] **Browser developer tools** show no console errors
- [ ] **Existing functionality** still works as expected

## CI/CD Testing

Your changes will be automatically tested in GitHub Actions CI when you submit a
PR. The CI runs:

- Tests on multiple Deno versions
- Tests on different operating systems (Linux, macOS, Windows)
- Linting and formatting checks
- Type checking across the entire codebase

## Debugging Test Failures

### Common Issues

**Permission Errors**

```sh Terminal
# Ensure you're using -A flag
deno test -A path/to/test.ts
```

**Import Resolution**

```sh Terminal
# Clear Deno cache if modules seem stale
deno cache --reload path/to/test.ts
```

**Snapshot Mismatches**

```sh Terminal
# Update snapshots if output intentionally changed
deno test -A --update-snapshots path/to/test.ts
```

### Debug Mode

```sh Terminal
# Run tests with debugger
deno test -A --inspect-brk packages/fresh/src/app_test.ts

# Enable verbose logging
FRESH_DEBUG=true deno test -A path/to/test.ts
```

## Getting Help

If you encounter issues while testing:

1. **Check existing issues**:
   [GitHub Issues](https://github.com/denoland/fresh/issues)
2. **Review test patterns**: Look at similar tests in the codebase
3. **Join the community**: [Deno Discord server](https://discord.gg/deno)

Remember: thorough testing helps ensure Fresh remains stable and reliable for
all users! 🧪
