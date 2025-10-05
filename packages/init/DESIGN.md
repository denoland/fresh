# Architecture & Maintenance

Maintainer documentation for `@fresh/init`.

## Design Philosophy

Templates are **complete, standalone projects**. The system selects one base
template and optionally applies variant overlays on top.

## Directory Structure

```
packages/init/
├── src/
│   ├── mod.ts            # CLI entry point (package default export)
│   ├── init.ts           # Core initialization logic
│   ├── types.ts          # Type definitions
│   ├── utils.ts          # File operations, version resolution
│   └── sync.ts           # Template synchronization tool
├── assets/
│   ├── base/             # Common files (edit here!)
│   │   ├── vite/         # Shared between vite templates
│   │   └── builder/      # Shared between builder templates
│   ├── template/         # Complete project templates
│   │   ├── vite/
│   │   ├── vite-tailwind/
│   │   ├── builder/
│   │   └── builder-tailwind/
│   └── variants/         # Additive overlays
│       ├── docker/
│       ├── vscode/
│       └── vscode-tailwind/
├── tests/                # Test suite
├── deno.json             # Package configuration
├── README.md             # User documentation
└── DESIGN.md             # This file
```

## Template Maintenance

Common files are stored in `assets/base/` and synced to template variants.

### Editing Common Files

1. Edit files in `assets/base/vite/` or `assets/base/builder/`
2. Run `deno task sync` to propagate changes
3. Template-specific files are preserved:
   - `deno.json` - Different dependencies per variant
   - `vite.config.ts` - Tailwind plugin configuration
   - `assets/styles.css` / `static/styles.css` - Tailwind imports

### Sync Commands

```bash
deno task sync           # Apply changes
deno task sync --dry-run # Preview without applying
```

The sync script (`src/sync.ts`) copies:

- `assets/base/vite/` → `vite/` and `vite-tailwind/`
- `assets/base/builder/` → `builder/` and `builder-tailwind/`

## File Processing

### Naming Convention

- `__filename` → `.filename` (e.g., `__gitignore` → `.gitignore`)

### Variable Substitution

Template files use `__VARIABLE__` syntax for text replacement:

**Project Variables:**

- `__PROJECT_NAME__` - Project name (from directory basename)

**Version Variables:**

- `__FRESH_VERSION__` - Fresh core version
- `__FRESH_TAILWIND_VERSION__` - Fresh Tailwind plugin version
- `__FRESH_VITE_PLUGIN_VERSION__` - Fresh Vite plugin version
- `__PREACT_VERSION__` - Preact version
- `__PREACT_SIGNALS_VERSION__` - Preact Signals version
- `__TAILWINDCSS_VERSION__` - Tailwind CSS version
- `__TAILWINDCSS_POSTCSS_VERSION__` - Tailwind CSS PostCSS version
- `__TAILWINDCSS_VITE_VERSION__` - Tailwind CSS Vite plugin version
- `__POSTCSS_VERSION__` - PostCSS version
- `__VITE_VERSION__` - Vite version
- `__DENO_VERSION__` - Deno version (current runtime)

Text files are processed for variable substitution. Binary files are copied
as-is.

**Note:** Boolean flags (tailwind, vscode, docker, builder) are used for
**template/variant selection logic**, not as substitutable variables in template
files.

## Template Selection

```typescript
// Base template
if (vite && tailwind) → "vite-tailwind"
else if (vite) → "vite"
else if (tailwind) → "builder-tailwind"
else → "builder"

// Variants (additive)
if (docker) → add "docker"
if (vscode && tailwind) → add "vscode-tailwind"
else if (vscode) → add "vscode"
```

## Version Resolution

Matches `@fresh/init` behavior:

- Fresh core: Fetched from network
- Other dependencies: Fixed versions (updated by release script)

## Development

```bash
deno task test    # Run test suite (55 tests)
deno task check   # Format, lint, type check
deno task sync    # Sync templates
```

## Testing

- **Unit tests** - Core functionality
- **Integration tests** - Full project generation and builds
- **CLI tests** - Command-line interface
- **Compatibility tests** - Verify output matches v2.0.9 (pre-refactor baseline)
- **Sync tests** - Template synchronization
