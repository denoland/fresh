# @fresh/init-templates

> **NOTE:** This package is functionally ready to replace `@fresh/init`. It
> maintains full backward compatibility with the old init package's CLI
> interface while using a modern template-based implementation. Package name is
> kept as `@fresh/init-templates` until the final replacement step.

Template-based initialization system for Fresh projects.

## Status

**Version:** 3.0.0-beta.1

This package provides identical functionality to `@fresh/init` v2.0.9 but uses a
template-based architecture for better maintainability. The CLI interface is
fully compatible with the old package:

```bash
# This works exactly like the old @fresh/init
deno run -Ar jsr:@fresh/init-templates my-project

# All flags are supported
deno run -Ar jsr:@fresh/init-templates my-app --tailwind --vscode --docker
```

## Compatibility Notes

- **CLI Interface:** Fully backward compatible with `@fresh/init` v2.0.9
- **Export Structure:** Main export points to `./src/mod.ts` (CLI entry point)
- **Function Signature:** Supports the old `initProject(cwd, input[], flags)`
  signature
- **Generated Projects:** Produce identical output to the old init package

## Library Usage (Advanced)

The main export is the CLI interface for compatibility. For programmatic use of
the template engine, import directly from source modules:

```typescript
import {
  initProject,
  resolveVersions,
} from "jsr:@fresh/init-templates/src/init";

const versions = await resolveVersions();
await initProject(Deno.cwd(), {
  directory: "./my-fresh-app",
  tailwind: true,
  vscode: true,
  docker: false,
  builder: false,
  force: false,
}, versions);
```

Note: Direct library imports use the new signature with fully resolved options
and explicit version management.

## Available Templates

**Build System:**

- Vite (recommended) - Modern build system with HMR
- Builder - Traditional Deno-based build system

**Styling:**

- Plain CSS (default)
- Tailwind CSS (`--tailwind`)

**Optional Variants:**

- VS Code configuration (`--vscode`)
- Docker support (`--docker`)

## Maintainer Documentation

For architecture, maintenance workflows, and development setup, see
[DESIGN.md](./DESIGN.md).
