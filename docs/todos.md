# Path-Specific Middleware Implementation TODOs

This document outlines the implementation steps for adding path-specific
middleware support to Fresh.

## 1. Update Router Interface

- [x] Modify the `Router` interface in `router.ts` to support path-specific
      middleware:
  - [x] Change `_middlewares` from `T[]` to
        `Array<{path: string | URLPattern, handlers: T[]}>`
  - [x] Update `addMiddleware` method signature to accept a path parameter

## 2. Update UrlPatternRouter Implementation

- [x] Modify the `UrlPatternRouter` class in `router.ts`:
  - [x] Change `_middlewares` property type to match the updated interface
  - [x] Update `addMiddleware` method to accept a path and an array of handlers
  - [x] Implement path conversion logic (string to URLPattern when needed)
  - [x] Update the `match` method to check URL against middleware paths
  - [x] Ensure proper parameter extraction from matched paths

## 3. Update App Class

- [x] Modify the `use` method in `app.ts` to support both signatures:
  - [x] Update method to handle being called with just middleware functions
  - [x] Update method to handle being called with a path followed by middleware
        functions
  - [x] Ensure proper path merging with the app's base path

## 4. Update mountApp Method

- [x] Update the `mountApp` method in `app.ts` to handle the new middleware
      structure:
  - [x] Update middleware merging logic when mounting another app

## 5. Update Tests

- [x] Add new tests for path-specific middleware functionality:
  - [x] Test middleware with exact path matching
  - [x] Test middleware with pattern matching
  - [x] Test middleware parameter extraction
  - [x] Test middleware ordering
  - [x] Test combined global and path-specific middleware

## 6. Update Documentation

- [x] Update Fresh documentation to include path-specific middleware:
  - [x] Update API reference
  - [x] Add examples
  - [x] Update middleware concepts documentation

## 7. Update Examples

- [x] Update or add example code to demonstrate the new functionality

## Implementation Notes

- Ensure backwards compatibility is maintained
- Keep the API simple and consistent with Fresh's design philosophy
- Ensure proper TypeScript type definitions
- Be mindful of performance, especially for applications with many middleware
  functions
