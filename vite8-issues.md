# Vite 8 / Rolldown Migration Notes

This document summarizes the migration work, regressions found, fixes applied, and investigation outcomes while moving `@fresh/plugin-vite` from Vite 7/Rollup behavior to Vite 8/Rolldown behavior.

---

## Current Status

- `deno test -A packages/plugin-vite/tests/build_test.ts`
  - ✅ **30 passed / 0 failed**
- Previously failing areas during migration:
  - Bare/JSR island resolution (`@marvinh-test/fresh-island`)
  - `.cjs` parsing failures in SSR build
  - CSS Modules not applied for island/imported chunks

---

## Root Causes Identified

### 1) Resolver contract differences in Rolldown path

**Symptoms**
- Build error:
  - `Could not load @marvinh-test/fresh-island - No such file or directory (os error 2)`

**Causes**
- `resolveId` result shape assumptions from previous behavior no longer held.
- Returned string IDs were not always sufficient in this path.
- `resolveId` metadata assumptions (`resolvedBy`) were invalid with current typings/runtime surface.
- `resolveId` options import attributes (`options.attributes`) are not available in current Rolldown integration (see linked Rolldown issue below).

**Fixes**
- Return object from resolver for deno namespaced IDs:
  - `return { id: toDenoSpecifier(...) }`
- Removed usage of unsupported resolver provenance metadata (`resolvedBy`).
- Stopped relying on unavailable import-attributes options in resolver:
  - Fallback to default type handling in plugin path.
- Result: remote island resolution now works again.

---

### 2) `.cjs` files transformed to ESM, then parsed as CommonJS

**Symptoms**
- SSR build errors such as:
  - `Cannot use export statement outside a module`
  - `Cannot use import statement outside a module`
- Reported on transformed `.cjs` files (e.g. demo fixtures).

**Cause**
- `fresh:patches` includes `cjsPlugin`, which rewrites CommonJS patterns to ESM-style syntax.
- Under Vite 8 / Rolldown / OXC strictness, `.cjs` is still interpreted as CommonJS by extension semantics.
- Result: transformed ESM syntax in `.cjs` became invalid for parser expectations.

**Fix**
- SSR workaround in `packages/plugin-vite/src/mod.ts`:
  - Mark `.cjs` as external in `rolldownOptions.external`.
- This bypasses problematic bundling/parsing path for `.cjs` in SSR.

**Notes**
- This is a practical compatibility workaround.
- Long-term ideal is upstream/toolchain alignment of module-kind and transformed output.

---

### 3) CSS Modules missing from island/imported chunks

**Symptoms**
- `vite build - css modules` test failed (computed styles were incorrect).
- Island route rendered, but expected island CSS was missing in output.

**Cause**
- Island CSS collection logic relied on manifest assumptions that did not consistently hold after migration.
- Shared/imported chunk CSS was not always associated with island entries.
- Manifest lookup by a single key strategy was insufficient with current output shape.

**Fix**
- In `server_snapshot.ts`, switched to robust CSS collection:
  - Build helper to resolve manifest chunk by reference (supports key/file matching).
  - Recursively walk `imports` graph.
  - Aggregate all reachable CSS into island entry CSS list.
- Result: CSS modules tests passed.

---

## Code-Level Changes (Summary)

### `packages/plugin-vite/src/plugins/deno.ts`

- Updated resolver behavior for Rolldown compatibility:
  - Return object form for deno specifier IDs.
- Removed unsupported assumptions:
  - No `resolvedBy` checks.
  - No direct `options.attributes` usage (unavailable in current environment).
- Preserved plugin-chain interoperability while keeping deno-first resolution intent.

### `packages/plugin-vite/src/mod.ts`

- Added SSR Rolldown external rule:
  - Externalize `.cjs` to avoid parser/module-kind mismatch in bundle phase.

### `packages/plugin-vite/src/plugins/server_snapshot.ts`

- Reworked island CSS gathering:
  - Added manifest reference resolution helper.
  - Added recursive import-graph CSS collection.
  - Ensured island registry receives full CSS set including transitive imports.

---

## Related Upstream References

- Rolldown import attributes support gap:
  - https://github.com/rolldown/rolldown/issues/2758
- Potentially related CSS/chunk behavior class:
  - https://github.com/rolldown/rolldown/issues/7012

---

## Migration Lessons

1. **Do not rely on non-standard resolver metadata** unless guaranteed by current types/runtime.
2. **Treat `.cjs` carefully** under stricter parser semantics; avoid producing ESM syntax in `.cjs` bundle path.
3. **Assume manifest shape variance** across bundlers; use resilient chunk resolution and import-graph traversal.
4. **Prefer behavior-based guards** (e.g., `external`, virtual IDs, imports graph) over provenance-based assumptions.

---

## Remaining Follow-up (Optional)

- Revisit `.cjs` external workaround when upstream parser/module-kind behavior improves.
- Consider narrowing `cjsPlugin` application scope to avoid `.cjs` transformation hazards.
- Add targeted regression tests around:
  - manifest key/file reference differences
  - transitive island CSS inclusion
  - deno resolver fallback behavior under Rolldown.