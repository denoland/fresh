# Architecture & Maintenance

Maintainer documentation for the Fresh init-templates package.

## Design Philosophy

Each template is a **complete, standalone project** - no overlays, patches, or
merging. The system generates one base template and optionally adds variant
files on top.

## Directory Structure

```
init-templates/
├── assets/
│   ├── base/              # Common files (edit here!)
│   │   ├── vite/         # Shared between vite & vite-tailwind
│   │   └── builder/      # Shared between builder & builder-tailwind
│   ├── template/         # 4 complete project templates
│   │   ├── vite/        # Vite without Tailwind
│   │   ├── vite-tailwind/ # Vite with Tailwind
│   │   ├── builder/     # Builder without Tailwind
│   │   └── builder-tailwind/
│   └── variants/         # Additive overlays
│       ├── docker/      # Adds Dockerfile
│       ├── vscode/      # Adds .vscode/ config
│       └── vscode-tailwind/ # Adds Tailwind autocomplete
├── src/
│   ├── init.ts           # Core template engine (pure logic)
│   ├── utils.ts          # File operations, version resolution
│   └── types.ts          # Type definitions
├── cli.ts                # CLI interface (prompts, validation)
├── sync_templates.ts     # Base → template sync script
└── tests/                # Comprehensive test suite
```

**Note on structure:** `cli.ts` and `sync_templates.ts` are kept in the root
(not `src/`) because they are executable entry points, not library code. This
makes their role immediately visible: `cli.ts` is the CLI tool,
`sync_templates.ts` is the maintenance script. The `src/` directory contains
only library implementation code meant to be imported.

## Template Maintenance Workflow

To reduce duplication, common files are stored in `assets/base/` and synced to
their template variants:

### Editing Common Files

1. **Edit files in `assets/base/vite/` or `assets/base/builder/`**
   - These are the source of truth for common files
   - Changes here will be synced to template variants

2. **Run the sync script:**
   ```bash
   deno task sync           # Apply changes
   deno task sync --dry-run # Preview without applying
   ```

3. **Template-specific files are never overwritten:**
   - `deno.json.tmpl` - Different dependencies per variant
   - `vite.config.ts` - Tailwind plugin configuration
   - `assets/styles.css` / `static/styles.css` - Tailwind imports

### Sync Script Logic

The sync script (`sync_templates.ts`) automatically:

- Copies `assets/base/vite/` → `assets/template/vite/` and `vite-tailwind/`
- Copies `assets/base/builder/` → `assets/template/builder/` and
  `builder-tailwind/`
- Skips template-specific files (identified by name patterns)
- Reports what was copied and any errors

## File Processing

### File Naming Conventions

- `__filename` → `.filename` during copy (e.g., `__gitignore` → `.gitignore`)
- All other files keep their original names and extensions

### Variable Substitution

Template files use double-underscore syntax for variable placeholders. During
project initialization, these variables are substituted with actual values:

- `__PROJECT_NAME__` - User's project name
- `__FRESH_VERSION__` - Latest Fresh version
- `__PREACT_VERSION__` - Latest Preact version
- `__PREACT_SIGNALS_VERSION__` - Latest Preact Signals version
- `__VITE_VERSION__` - Latest Vite version
- `__TAILWINDCSS_VERSION__` - Latest Tailwind CSS version
- `__DENO_VERSION__` - Latest Deno version

Variable substitution is attempted on all text files. Binary files are copied
as-is without modification. This approach allows template files to maintain
their proper file extensions (`.ts`, `.tsx`, `.json`) for correct syntax
highlighting and editor tooling while still supporting variable substitution.

## Template Selection Logic

```typescript
// Base template selection
if (vite && tailwind) → "vite-tailwind"
else if (vite) → "vite"
else if (tailwind) → "builder-tailwind"
else → "builder"

// Then apply variants (additive only)
if (docker) → add files from variants/docker/
if (vscode && tailwind) → add files from variants/vscode-tailwind/
else if (vscode) → add files from variants/vscode/
```

## Development Commands

```bash
deno task test    # Run all tests (45 tests)
deno task check   # Format, lint, and type check
deno task sync    # Sync base templates to variants
```

## Testing Strategy

- **Unit tests** (`init_test.ts`, `utils_test.ts`, `template_test.ts`) - Fast,
  focused tests
- **Integration tests** (`integration_test.ts`) - Full project generation and
  build verification
- **CLI tests** (`cli_test.ts`) - Command-line interface testing
- **Sync tests** (`sync_templates_test.ts`) - Template sync verification

All tests use `@std/expect` for assertions and run with full permissions via
`deno task test` (uses `-A` flag).
