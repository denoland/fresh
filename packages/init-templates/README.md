# @fresh/init-templates

Template-based initialization system for Fresh projects.

## CLI Usage

```bash
# Interactive mode
deno run -Ar jsr:@fresh/init-templates my-project

# With options
deno run -Ar jsr:@fresh/init-templates my-app --tailwind --vscode --docker
```

## Library Usage

```typescript
import { initProject } from "@fresh/init-templates";

await initProject(Deno.cwd(), {
  directory: "./my-fresh-app",
  tailwind: true,
  vscode: true,
  docker: false,
});
```

## Available Templates

**Build System:**

- Vite (recommended) - Modern build system with HMR
- Builder - Traditional Deno-based build system

**Styling:**

- Plain CSS (default)
- Tailwind CSS (`--tailwind`)

**Optional Variants:**

- VS Code configuration (`--vscode`)
- Docker support (`--docker`)

## Maintainer Documentation

For architecture, maintenance workflows, and development setup, see
[DESIGN.md](./DESIGN.md).
