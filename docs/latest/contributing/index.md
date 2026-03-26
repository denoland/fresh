---
description: |
  Guidelines and resources for contributing to Fresh.
---

# Contributing

Fresh is organized as a monorepo with multiple packages:

- **`packages/fresh/`** - Core Fresh framework (`@fresh/core`)
- **`packages/plugin-vite/`** - Vite integration plugin (`@fresh/plugin-vite`)
- **`packages/plugin-tailwindcss/`** - Tailwind CSS v4 plugin
- **`packages/plugin-tailwindcss-v3/`** - Tailwind CSS v3 plugin
- **`packages/init/`** - Project scaffolding tool
- **`packages/update/`** - Fresh update utilities
- **`www/`** - Documentation website (fresh.deno.dev)

## Quick Start

1. Fork and clone the repository
2. Make your changes in the appropriate package
3. Run all checks before submitting:

```sh Terminal
deno task ok
```

This runs formatting, linting, type checking, and the full test suite.

## Next Steps

- [Local Development](./local-development) - Workspace setup and testing with
  external projects
- [Testing Changes](./testing) - Running and writing tests
