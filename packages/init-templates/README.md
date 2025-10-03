# @fresh/init-templates

Template-based initialization system for Fresh projects.

## Overview

This package provides a modern, maintainable approach to generating Fresh
projects using file-based templates instead of inline strings. It's designed to
be more extensible and easier to maintain than the previous generation-based
approach.

## Features

- 📁 **File-based templates**: All project files stored as proper templates
- 🔧 **Modular variants**: Mix and match features (Tailwind, VS Code, Docker)
- 🧪 **Well-tested**: Comprehensive unit tests for template processing
- 🔄 **Variable substitution**: Dynamic content using template variables
- 🎯 **Type-safe**: Full TypeScript support throughout

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

- `template-vite/`: Vite-based project template (default)
- `template-builder/`: Legacy builder-based template
- `variants/`: Modular additions (Tailwind, VS Code, Docker)

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

## Adding New Templates

1. Create a new directory under `templates/`
2. Add template files (use `.tmpl` extension for files with variables)
3. Update the template selection logic in `src/init.ts`
4. Add tests for the new template

## Adding Variants

1. Create a new directory under `templates/variants/`
2. Add files to overlay on base templates
3. Use `.patch` files to merge changes into existing template files
4. Update variant collection logic in `src/init.ts`

## License

MIT License - see LICENSE file in repository root
