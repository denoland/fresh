# @fresh/init-templates

Template-based initialization system for Fresh projects.

## Overview

This package provides a modern, maintainable approach to generating Fresh
projects using file-based templates instead of inline strings. It's designed to
be more extensible and easier to maintain than the previous generation-based
approach.

## Features

- 📁 **File-based templates**: All project files stored as proper templates
- 🎯 **Dead simple**: Each template folder contains exactly what gets generated
- ➕ **Additive variants**: Docker and VS Code support as simple overlays
- 🧪 **Well-tested**: Comprehensive unit tests for template processing
- 🔄 **Variable substitution**: Minimal dynamic content using template variables
- 🎯 **Type-safe**: Full TypeScript support throughout

## Philosophy

**Simplicity over cleverness.** Each template is a complete, standalone project.
No overlay systems, no patch files, no JSON merging. Just copy files and
substitute a few variables.

Want to see what a Vite + Tailwind project looks like? Browse
`templates/vite-tailwind/`. That's it.

## Architecture

See [DESIGN.md](./DESIGN.md) for a comprehensive overview of the template system
architecture, file structure, and design decisions.

## Usage

```typescript
import { initProject } from "@fresh/init-templates";

await initProject(Deno.cwd(), {
  directory: "./my-fresh-app",
  tailwind: true,
  vscode: true,
});
```

## Template Structure

Templates are organized in the `templates/` directory:

**Complete Templates:**

- `vite/`: Vite-based project (no Tailwind)
- `vite-tailwind/`: Vite-based project with Tailwind CSS
- `builder/`: Builder-based project (no Tailwind)
- `builder-tailwind/`: Builder-based project with Tailwind CSS

**Additive Variants:**

- `variants/docker/`: Adds Dockerfile only
- `variants/vscode/`: Adds .vscode/ folder only

## Development

```bash
# Run tests
deno task test

# Check code
deno task check
```

## Template Variables

Templates support variable substitution using `{{VARIABLE_NAME}}` syntax:

- `{{PROJECT_NAME}}`: Project directory name
- `{{FRESH_VERSION}}`: Fresh framework version
- `{{PREACT_VERSION}}`: Preact version
- And more... (see DESIGN.md for full list)

## Adding New Complete Templates

1. Create a new directory under `templates/` (e.g., `vite-typescript/`)
2. Add ALL files the template needs (complete, standalone)
3. Use `.tmpl` extension for files with variables
4. Update the template selection logic in `src/init.ts`
5. Add tests in `tests/template_test.ts`

**No overlays, no patches, no magic.** Each template is what you get.

## Adding Variants

Variants should be **truly additive** - they only add new files or folders,
never modify existing ones.

1. Create a new directory under `templates/variants/`
2. Add only new files (e.g., `Dockerfile`, `.vscode/` folder)
3. Update variant collection logic in `src/init.ts`
4. Add tests

Examples of good variants: `docker/` (adds Dockerfile), `vscode/` (adds
.vscode/)

Examples of bad variants: modifying existing files (use complete templates
instead)

## License

MIT License - see LICENSE file in repository root
