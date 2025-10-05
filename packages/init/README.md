# @fresh/init-templates

Template-based initialization system for Fresh projects. Backward compatible
with `@fresh/init`.

## Usage

### CLI

```bash
# Interactive mode
deno run -Ar jsr:@fresh/init-templates my-project

# With options
deno run -Ar jsr:@fresh/init-templates my-app --tailwind --vscode --docker
```

**Options:**

- `--force` - Overwrite existing files
- `--tailwind` - Include Tailwind CSS
- `--vscode` - Add VS Code configuration
- `--docker` - Add Docker support
- `--builder` - Use builder instead of Vite
- `--help` - Show help message

### Programmatic

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

## Templates

**Build Systems:**

- **Vite** (default) - Modern build system with HMR
- **Builder** - Traditional Deno-based build system

**Styling:**

- **Plain CSS** (default)
- **Tailwind CSS** (`--tailwind`)

**Optional Features:**

- **VS Code** configuration (`--vscode`)
- **Docker** support (`--docker`)

## Maintainer Documentation

See [DESIGN.md](./DESIGN.md) for architecture, maintenance workflows, and
development setup.
