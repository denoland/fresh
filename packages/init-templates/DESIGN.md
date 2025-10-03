# Fresh Template-Based Init System - Design Document

## Overview

This document describes the new template-based initialization system for Fresh
projects, replacing the inline string-based generation approach with a more
maintainable template structure inspired by `create-vite`.

## Motivation

The current `@fresh/init` package generates all project files using inline
string templates within `init.ts`. While functional, this approach has several
drawbacks:

1. **Maintainability**: Changes to templates require editing TypeScript strings
2. **Testability**: Difficult to validate generated files without running the
   full init process
3. **Extensibility**: Adding new templates or variants requires significant code
   changes
4. **Readability**: Template content is mixed with generation logic

## Design Philosophy

**Dead simple. Prefer redundancy over cleverness.**

- Each template folder contains a complete, standalone project
- No overlay systems, no patch files, no JSON merging
- Browse a template directory to see exactly what gets generated
- Variants are truly additive (only add files, never modify existing ones)

This means some file duplication (e.g., `Button.tsx` exists in 4 templates), but
the mental model is trivial: **what you see is what you get**.

## Architecture

### Directory Structure

```
packages/init-templates/
├── deno.json
├── README.md
├── DESIGN.md (this file)
├── mod.ts (main entry point)
├── src/
│   ├── init.ts (template engine)
│   ├── prompts.ts (user prompts)
│   ├── types.ts (type definitions)
│   └── utils.ts (helper functions)
├── tests/
│   ├── init_test.ts
│   ├── template_test.ts
│   └── fixtures/
├── templates/
│   ├── vite/                        # Complete Vite project (no Tailwind)
│   │   ├── __gitignore
│   │   ├── README.md
│   │   ├── deno.json.tmpl
│   │   ├── vite.config.ts
│   │   ├── main.ts
│   │   ├── client.ts
│   │   ├── assets/
│   │   │   └── styles.css
│   │   ├── components/
│   │   │   └── Button.tsx
│   │   ├── islands/
│   │   │   └── Counter.tsx
│   │   ├── routes/
│   │   │   ├── index.tsx
│   │   │   ├── _app.tsx.tmpl
│   │   │   └── api/
│   │   │       └── [name].tsx
│   │   └── static/
│   │       └── logo.svg
│   ├── vite-tailwind/               # Complete Vite + Tailwind project
│   │   ├── (same structure as vite/)
│   │   ├── vite.config.ts           # ← With tailwindcss() plugin
│   │   ├── deno.json.tmpl           # ← With Tailwind imports
│   │   └── assets/
│   │       └── styles.css           # ← Tailwind @imports
│   ├── builder/                     # Complete Builder project (no Tailwind)
│   │   ├── __gitignore
│   │   ├── README.md
│   │   ├── deno.json.tmpl
│   │   ├── dev.ts.tmpl
│   │   ├── main.ts
│   │   ├── (routes, islands, components...)
│   │   └── static/
│   │       ├── styles.css
│   │       └── logo.svg
│   └── builder-tailwind/            # Complete Builder + Tailwind project
│       ├── (same structure as builder/)
│       ├── dev.ts.tmpl              # ← With tailwindcss() plugin
│       ├── deno.json.tmpl           # ← With Tailwind imports
│       └── static/
│           └── styles.css           # ← Tailwind @imports
└── variants/                        # Additive variants (at package root)
    ├── docker/                      # Additive: just adds Dockerfile
    │   └── Dockerfile
    └── vscode/                      # Additive: just adds .vscode/
        └── __vscode/
            ├── settings.json.tmpl
            └── extensions.json.tmpl
```

### File Naming Conventions

- **`__filename`**: Files starting with double underscore are renamed to
  dot-prefixed (e.g., `__gitignore` → `.gitignore`, `__vscode` → `.vscode`)
- **`_filename`**: Files with single underscore remain unchanged (e.g.,
  `_app.tsx` stays as `_app.tsx`)
- **`filename.tmpl`**: Template files with variable substitution
- **`filename.patch`**: Patch files that modify base template files (for
  variants)
- **Regular files**: Copied as-is

### Template Variables

Template files (`.tmpl`) support variable substitution using `{{VARIABLE_NAME}}`
syntax:

```typescript
// Available variables:
{
  PROJECT_NAME: string; // e.g., "my-fresh-app"
  FRESH_VERSION: string; // e.g., "2.1.1"
  PREACT_VERSION: string; // e.g., "10.27.2"
  PREACT_SIGNALS_VERSION: string; // e.g., "2.3.1"
  TAILWIND_VERSION: string; // e.g., "4.1.10"
  VITE_PLUGIN_VERSION: string; // e.g., "1.0.0"
  TAILWIND_PLUGIN_VERSION: string; // e.g., "1.0.0"
  POSTCSS_VERSION: string; // e.g., "8.5.6"
  DENO_VERSION: string; // e.g., "2.0.0"
  // Conditional flags
  USE_TAILWIND: boolean;
  USE_VSCODE: boolean;
  USE_DOCKER: boolean;
}
```

### Template Engine

The template engine (`src/init.ts`) performs the following steps:

1. **Template Selection**: Pick the complete template based on options:
   ```typescript
   if (useVite && useTailwind) templateName = "vite-tailwind";
   else if (useVite) templateName = "vite";
   else if (useTailwind) templateName = "builder-tailwind";
   else templateName = "builder";
   ```

2. **Variable Resolution**: Fetch latest versions from JSR and create variable
   context

3. **Template Processing**:
   - Copy all files from the selected complete template
   - Process `.tmpl` files with variable substitution
   - Rename `__` prefixed files to `.` prefixed

4. **Variant Application** (optional):
   - Copy files from docker/ variant if requested
   - Copy files from vscode/ variant if requested

5. **Validation**: Ensure all required files are present

That's it! No overlays, no patches, no JSON merging.

### Variant System (Simplified)

Variants are **truly additive** - they only add new files, never modify existing
ones:

- **`docker/`**: Adds just a `Dockerfile`
- **`vscode/`**: Adds just a `.vscode/` folder

If a feature requires modifying existing files (like Tailwind does), it gets its
own complete template instead of being a variant. This is why we have:

- `templates/vite/` and `templates/vite-tailwind/` (not `templates/vite/` +
  variant overlay)
- `templates/builder/` and `templates/builder-tailwind/` (not
  `templates/builder/` + variant overlay)

**Trade-off**: Some file duplication, but zero complexity.

## API Design

### Main Entry Point

```typescript
// mod.ts
export { initProject } from "./src/init.ts";
export type { InitOptions } from "./src/types.ts";
```

### InitOptions Interface

```typescript
export interface InitOptions {
  // Target directory
  directory: string;

  // Build system
  builder?: boolean; // true = legacy builder, false/undefined = vite

  // Feature flags
  tailwind?: boolean;
  vscode?: boolean;
  docker?: boolean;

  // Force overwrite
  force?: boolean;

  // Version overrides (mainly for testing)
  versions?: {
    fresh?: string;
    preact?: string;
    // ... etc
  };
}
```

### Core Functions

```typescript
// src/init.ts
export async function initProject(
  cwd: string,
  options: InitOptions,
): Promise<void>;

async function resolveVariables(
  options: InitOptions,
): Promise<TemplateVariables>;
async function processTemplate(
  templateDir: string,
  targetDir: string,
  variables: TemplateVariables,
): Promise<void>;
async function applyVariant(
  variantDir: string,
  targetDir: string,
  variables: TemplateVariables,
): Promise<void>;
```

## Testing Strategy

### Unit Tests

1. **Template Existence**: Verify all 4 complete templates have required files
2. **Tailwind Integration**: Verify tailwind templates actually include Tailwind
3. **Variable Substitution**: Test variable replacement in `.tmpl` files
4. **File Copying**: Ensure files are copied with correct names
5. **Variant Application**: Test docker and vscode variants add files correctly
6. **Variant Application**: Test patch merging and overlay logic
7. **Conditional Logic**: Test boolean flags affect output correctly

### Integration Tests (Scaffolding)

The package includes test scaffolding for future integration tests that:

- Generate complete projects using templates
- Run `deno task check` on generated projects
- Execute `deno task dev` and verify server starts
- Run `deno task build` and verify output

These integration tests will be fully implemented in a subsequent phase.

## Migration Path

### Phase 1: Template Extraction (Current)

- Create `packages/init-templates/`
- Extract all templates from current `init.ts`
- Implement template engine
- Add unit tests
- Keep existing `@fresh/init` unchanged

### Phase 2: Integration Testing

- Implement full integration tests
- Create base-* folders for common files
- Add build script for template generation
- Validate all template combinations

### Phase 3: Switchover

- Update Fresh CLI to use `@fresh/init-templates`
- Deprecate old `@fresh/init`
- Update documentation

## Advantages Over Current System

1. **Clear Separation**: Template content separate from generation logic
2. **Easy Updates**: Modify templates without touching TypeScript code
3. **Better Testing**: Can validate templates independently
4. **Version Control**: Templates are proper files with meaningful diffs
5. **Extensibility**: Add new templates or variants by adding directories
6. **Maintainability**: Easier to review and update template content
7. **Reusability**: Variant system prevents duplication

## Future Enhancements

1. **Interactive Mode**: More sophisticated prompts with descriptions
2. **Custom Templates**: Allow users to create and use their own templates
3. **Template Registry**: Community-contributed templates
4. **Incremental Updates**: Update existing projects with new template features
5. **Template Validation**: CLI command to validate template structure
6. **Template Previews**: Show what files will be generated before creating

## Comparison with Current System

### Current Approach

```typescript
// Everything in init.ts
const MAIN_TS = `import { App } from "fresh";
export const app = new App();`;
await writeFile("main.ts", MAIN_TS);
```

### New Approach

```typescript
// Template in templates/template-vite/main.ts
// Generation logic in src/init.ts
await processTemplate("template-vite", targetDir, variables);
```

This separation makes the codebase more maintainable and the templates easier to
understand and modify.
