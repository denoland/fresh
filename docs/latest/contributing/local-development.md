---
description: |
  Set up a local development environment for contributing to Fresh.
---

# Local Development

## Prerequisites

- [Deno](https://deno.com/) (latest version)
- Git

## Working in the Fresh Repository

Clone the repo and run tests to verify your setup:

```sh Terminal
git clone https://github.com/denoland/fresh.git
cd fresh
deno task test
```

The repository uses Deno
[workspaces](https://docs.deno.com/runtime/fundamentals/workspaces/) so all
packages in `packages/` are automatically available to each other using their
published names (`@fresh/core`, `@fresh/plugin-vite`, etc.).

### Documentation Website

The `www/` directory uses the local Fresh packages, making it a good integration
test:

```sh Terminal
deno task www        # start dev server
deno task build-www  # production build
```

### Vite Plugin Demo

Test Vite plugin changes with the built-in demo app:

```sh Terminal
deno task demo        # dev server
deno task demo:build  # production build
deno task demo:start  # serve production build
```

## Testing in External Projects

To use your local Fresh checkout in a separate project, add
[`links`](https://docs.deno.com/runtime/fundamentals/configuration/#links) to
the project's `deno.json`:

```json deno.json
{
  "imports": {
    "@fresh/core": "jsr:@fresh/core@^2.0.0",
    "@fresh/plugin-vite": "jsr:@fresh/plugin-vite@^1.0.0"
  },
  "links": [
    "../path/to/fresh/packages/fresh",
    "../path/to/fresh/packages/plugin-vite"
  ]
}
```

This overrides the JSR packages with your local versions. Changes are reflected
immediately without rebuilding.

Verify it worked by checking for `file://` URLs in the dependency tree:

```sh Terminal
deno info --json | grep "file://"
```
