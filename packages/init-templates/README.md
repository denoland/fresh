# @fresh/init-templates

Template-based initialization system for Fresh projects. Each template is a
complete, standalone project.

## CLI Usage

```bash
# Interactive
deno run -Ar jsr:@fresh/init-templates my-project

# With options
deno run -Ar jsr:@fresh/init-templates my-app --tailwind --vscode
```

## Library Usage

```typescript
import { initProject } from "@fresh/init-templates";

await initProject(Deno.cwd(), {
  directory: "./my-fresh-app",
  tailwind: true,
  vscode: true,
});
```

## Templates

**Complete Templates** (in `assets/template/`):

- `vite/` - Vite without Tailwind
- `vite-tailwind/` - Vite with Tailwind
- `builder/` - Builder without Tailwind
- `builder-tailwind/` - Builder with Tailwind

**Base Templates** (in `assets/base/`, for maintenance):

- `vite/` - Common files shared by vite and vite-tailwind
- `builder/` - Common files shared by builder and builder-tailwind

**Variants** (in `assets/variants/`, additive only):

- `docker/` - Adds Dockerfile
- `vscode/` - Adds .vscode/ config
- `vscode-tailwind/` - Adds Tailwind autocomplete

## Template Files

- `__filename` → `.filename` (e.g., `__gitignore` → `.gitignore`)
- `filename.tmpl` → Variable substitution with `{{VAR_NAME}}`
- Other files copied as-is

## Template Maintenance

To maintain common files across template variants:

1. **Edit base templates**: Modify files in `assets/base/vite/` or
   `assets/base/builder/`
2. **Sync changes**: Run `deno task sync` to copy to template variants
3. **Template-specific files** are never overwritten:
   - `deno.json.tmpl` (different dependencies per variant)
   - `vite.config.ts` (Tailwind plugin configuration)
   - `assets/styles.css` / `static/styles.css` (Tailwind imports)

```bash
deno task sync           # Sync base → templates
deno task sync --dry-run # Preview changes without applying
```

## Development

```bash
deno task test    # Run tests
deno task check   # Check code
deno task sync    # Sync base templates
```

See [DESIGN.md](./DESIGN.md) for architecture details.
