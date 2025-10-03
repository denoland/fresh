# Architecture

Template-based init system for Fresh projects. Each template is a complete,
standalone project - no overlays, patches, or merging.

## Structure

```
init-templates/
├── templates/          # 4 complete project templates
│   ├── vite/          # Vite without Tailwind
│   ├── vite-tailwind/ # Vite with Tailwind
│   ├── builder/       # Builder without Tailwind
│   └── builder-tailwind/
└── variants/          # Additive overlays
    ├── docker/        # Adds Dockerfile
    ├── vscode/        # Adds .vscode/ config
    └── vscode-tailwind/ # Adds Tailwind autocomplete
```

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
