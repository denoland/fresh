---
description: |
  Fresh directory layout and how to customize it.
---

Out of the box your project should look like so:

```
.
├── islands/
│   ├── Counter.tsx
│   └── ...
├── routes/
│   ├── index.tsx
│   └── ...
├── static/
│   └── ...
├── deno.json
├── dev.ts
├── import_map.json
├── main.ts
└── ...
```

### Using a `src` directory

If you'd like your code to live in a `src`, or any other directory of your 
choosing, you'll need to move your `import_map.json`, `dev.ts`, `main.ts`, 
`routes/`, `islands/`, and `static/` files/directories into that directory. 
Your project directory layout should end up looking like something below:

```
.
├── deno.json
├── src/
│   ├── islands/
│   │   ├── Counter.tsx
│   │   └── ...
│   ├── routes/
│   │   ├── index.tsx
│   │   └── ...
│   ├── static/
│   │   └── ...
│   ├── dev.ts
│   ├── import_map.json
│   ├── main.ts
│   └── ...
└── ...
```

You will also need to update your `deno.json` to point to new entrypoint and
import map location like so:

```json
{
  "tasks": {
    "start": "deno run -A --watch=src/ src/dev.ts"
  },
  "importMap": "./src/import_map.json"
}
```

