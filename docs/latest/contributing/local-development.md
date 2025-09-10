---
description: |
  Set up a local development environment for contributing to Fresh.
---

# Local Development

This guide explains how to set up your development environment to work on Fresh
and test your changes locally.

## Prerequisites

- [Deno](https://deno.com/) latest version installed
- Git for version control

## Development Scenarios

There are two main scenarios for Fresh development:

1. **Working on Fresh itself** - Contributing directly to the Fresh repository
2. **Testing Fresh in external projects** - Using your local Fresh changes in
   separate projects

## Working on Fresh Repository

When you clone and work directly in the Fresh repository, Deno's workspace
feature automatically uses the local packages.

### Initial Setup

```sh Terminal
# Clone the repository
git clone https://github.com/denoland/fresh.git
cd fresh

# Run tests to verify everything works
deno task test
```

### Workspace Configuration

The Fresh repository uses a workspace configuration in `deno.json`:

```json deno.json
{
  "workspace": [
    "./packages/*",
    "./www"
  ]
}
```

This automatically makes all packages in `packages/` available to each other and
the documentation website using their published names (`@fresh/core`,
`@fresh/plugin-vite`, etc.).

### Testing Your Changes

The repository provides several ways to test changes:

#### Documentation Website

The `www/` directory uses the local Fresh packages:

```sh Terminal
# Start the documentation site
deno task www

# Build the documentation site
deno task build-www
```

#### Vite Plugin Demo

Test Vite plugin changes using the built-in demo:

```sh Terminal
# Run the Vite plugin demo
deno task demo

# Build the demo
deno task demo:build

# Start the built demo
deno task demo:start
```

## Testing Fresh in External Projects

To test your Fresh changes in a separate project, you need to override the JSR
packages with your local versions.

### Using the `links` Configuration

In your test project's `deno.json`, add a `links` field:

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

### Verification

To verify that your local packages are being used:

```sh Terminal
# Check which version Deno is resolving
deno info

# Look for your local paths in the dependency tree
deno info --json | grep "file://"
```

You should see file:// URLs pointing to your local Fresh packages instead of JSR
URLs.

### Example Setup

Here's a complete example of testing Fresh locally:

1. **Clone Fresh and make your changes:**
   ```sh Terminal
   git clone https://github.com/denoland/fresh.git
   cd fresh
   # Make your changes to packages/fresh/src/...
   ```

2. **Create a test project:**
   ```sh Terminal
   cd ..
   deno run -A -r jsr:@fresh/init my-test-app
   cd my-test-app
   ```

3. **Configure the test project to use local Fresh:**
   ```json deno.json
   {
     "tasks": {
       "dev": "vite",
       "build": "vite build",
       "preview": "deno serve -A _fresh/server.js"
     },
     "imports": {
       "@fresh/core": "jsr:@fresh/core@^2.0.0",
       "@fresh/plugin-vite": "jsr:@fresh/plugin-vite@^1.0.0"
     },
     "links": [
       "../fresh/packages/fresh",
       "../fresh/packages/plugin-vite"
     ]
   }
   ```

4. **Test your changes:**
   ```sh Terminal
   deno task dev
   ```

## Common Development Tasks

### Adding New Features

1. Make changes in the appropriate package (`packages/fresh/src/` for core
   features)
2. Add tests for new functionality
3. Test using the documentation website or demo applications
4. Run `deno task ok` before submitting

### Debugging

Use Deno's built-in debugging tools:

```sh Terminal
# Run with debugger attached
deno run --inspect-brk -A your-script.ts

# Enable verbose logging
deno task dev --log-level debug
```

### Package Dependencies

When working across packages, be aware of the import patterns:

- **Within workspace**: Use published names
  (`import { App } from "@fresh/core"`)
- **External testing**: Ensure `links` configuration points to correct paths
- **Runtime vs Dev**: Some imports are development-only (in `src/dev/`)

## Performance Tips

- Use `--parallel` flag for faster testing: `deno test -A --parallel`
- The `links` feature doesn't require rebuilding - changes are reflected
  immediately
- Clear Deno cache if you encounter stale module issues: `deno cache --reload`

## Troubleshooting

### Common Issues

**"Could not find _fresh directory"**

- Ensure you've run `vite build` in Vite-based projects
- Check that your `links` configuration points to the correct paths

**"Permission denied" errors**

- Fresh requires `--allow-all` or specific permissions for file system access
- Use `-A` flag for development: `deno run -A your-script.ts`

**Module resolution errors**

- Verify `links` paths are relative to the project containing `deno.json`
- Check that linked packages have valid `deno.json` files with correct names

### Getting Help

- Check existing [GitHub Issues](https://github.com/denoland/fresh/issues)
- Review the [troubleshooting guide](../advanced/troubleshooting)
- Join the community [Deno Discord server](https://discord.gg/deno)
