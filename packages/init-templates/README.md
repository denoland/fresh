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

**Complete Templates** (in `templates/`):

- `vite/` - Vite without Tailwind
- `vite-tailwind/` - Vite with Tailwind
- `builder/` - Builder without Tailwind
- `builder-tailwind/` - Builder with Tailwind

**Variants** (in `variants/`, additive only):

- `docker/` - Adds Dockerfile
- `vscode/` - Adds .vscode/ config
- `vscode-tailwind/` - Adds Tailwind autocomplete

## Template Files

- `__filename` → `.filename` (e.g., `__gitignore` → `.gitignore`)
- `filename.tmpl` → Variable substitution with `{{VAR_NAME}}`
- Other files copied as-is

## Development

```bash
deno task test    # Run tests
deno task check   # Check code
```

See [DESIGN.md](./DESIGN.md) for architecture details.
