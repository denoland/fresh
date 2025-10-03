# Architecture

Template-based init system for Fresh projects. Each template is a complete,
standalone project - no overlays, patches, or merging.

## Structure

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
└── sync_templates.ts     # Syncs base → templates
```

## Template Maintenance

To reduce duplication, common files are stored in `assets/base/` and synced to
their template variants:

- **Edit common files in `assets/base/vite/` or `assets/base/builder/`**
- Run `deno task sync` to copy to template variants
- Template-specific files are never overwritten:
  - `deno.json.tmpl` (different dependencies)
  - `vite.config.ts` (Tailwind plugin for tailwind variants)
  - `assets/styles.css` / `static/styles.css` (Tailwind imports)

Use `deno task sync --dry-run` to preview changes before applying.

## File Naming

- `__filename` → `.filename` (e.g., `__gitignore` → `.gitignore`)
- `filename.tmpl` → Variable substitution with `{{VAR_NAME}}`
- Other files copied as-is

## Template Selection

```typescript
if (vite && tailwind) → "vite-tailwind"
else if (vite) → "vite"
else if (tailwind) → "builder-tailwind"
else → "builder"
```

Then apply variants: `docker`, `vscode`, `vscode-tailwind` (additive only).
