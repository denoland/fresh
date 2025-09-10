# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

Fresh is a next-generation web framework for Deno, built for speed, reliability,
and simplicity. Fresh 2.0 (current major version) features just-in-time
rendering on the edge, island-based client hydration, zero runtime overhead, and
TypeScript support out of the box. **Fresh 2.0 uses Vite as the default build
system.**

## Monorepo Structure

This is a monorepo with a workspace configuration:

- `packages/fresh/` - Core Fresh framework (`@fresh/core`)
- `packages/plugin-vite/` - **Default** Vite integration plugin
  (`@fresh/plugin-vite`)
- `packages/plugin-tailwindcss/` - Tailwind CSS v4 plugin (legacy build mode
  only)
- `packages/plugin-tailwindcss-v3/` - Tailwind CSS v3 plugin (legacy build mode
  only)
- `packages/init/` - Fresh project scaffolding tool
- `packages/update/` - Fresh update utilities
- `packages/build-id/` - Build ID utilities
- `packages/examples/` - Example apps and components
- `www/` - Fresh documentation website (fresh.deno.dev)

## Development Commands

### Essential Commands

- `deno task test` - Run all tests with parallel execution
- `deno task ok` - **REQUIRED before submitting PRs** - runs format check, lint,
  type check, and tests
- `deno task check:types` - Type check all TypeScript files
- `deno fmt --check && deno lint` - Check formatting and linting

### Fresh 2.0 Development (Vite-based)

- `vite` - Start development server with HMR (default build mode)
- `vite build` - Build for production (creates `_fresh/` directory)
- `deno serve -A _fresh/server.js` - Start production server

### Documentation Website

- `deno task www` - Start the documentation website in development mode
- `deno task build-www` - Build the documentation website
- `deno task test:www` - Run tests for the documentation website

### Plugin Development

- `deno task demo` - Run Vite plugin demo (packages/plugin-vite)
- `deno task demo:build` - Build Vite plugin demo
- `deno task demo:start` - Start built Vite plugin demo

### Other Utilities

- `deno task screenshot [url] [name]` - Take screenshots for showcase
- `deno task release` - Release management
- `deno task check:docs` - Validate documentation

## Core Architecture

### Fresh 2.0 Build System

**Fresh 2.0 uses Vite as the default and recommended build system.** The legacy
Builder-based system is deprecated.

#### Vite Integration (`packages/plugin-vite/`) - Default

- **Primary build system** for Fresh 2.0 applications
- Modern bundling with HMR (Hot Module Replacement)
- Deno loader integration for native Deno imports
- Client-side code splitting and optimized bundling
- Requires `vite.config.ts` with Fresh plugin configuration
- Tailwind CSS v4 integration via `@tailwindcss/vite`

#### Legacy Builder System (`packages/fresh/src/dev/builder.ts`) - Deprecated

- Used during Fresh 2.0 alpha before Vite plugin was available
- ESBuild-based building system
- Only use if you cannot migrate to Vite
- Required for `@fresh/plugin-tailwindcss*` packages

### Fresh Framework Core (`packages/fresh/`)

- **Runtime System**: Client/server runtime with shared utilities
- **File-system Routing**: Automatic routing based on file structure
- **Islands Architecture**: Selective hydration with minimal client-side JS
- **Middleware System**: CSRF, CORS, static files, trailing slashes
- **Development Tools**: Hot reload, error overlay, automatic workspace
  detection

### Key Components

- `src/app.ts` - Main application entry point and server setup
- `src/handlers.ts` - Route handlers and page responses
- `src/router.ts` - File-system based routing logic
- `src/context.ts` - Request context and Fresh context types
- `src/middlewares/` - Built-in middleware implementations
- `src/runtime/` - Client/server runtime code
- `src/dev/` - Development-only utilities and middlewares

### Configuration

#### Fresh 2.0 Configuration

- **`vite.config.ts`** - Primary configuration for Vite-based builds
- **`main.ts`** - Server entry point with App configuration
- **`client.ts`** - Client entry point for CSS imports and client-side code
- No `fresh.config.ts` or `fresh.gen.ts` needed (removed in Fresh 2.0)
- No `dev.ts` needed (replaced by `vite.config.ts`)

#### Deno Configuration

- Uses `deno.json` for workspace configuration, tasks, and imports
- JSX configured for Preact with precompilation
- TypeScript with DOM and Deno namespace types
- Linting rules include Fresh, JSR, JSX, and React recommended rules

## Testing Approach

- Tests use Deno's built-in testing framework
- Test files follow `*_test.ts` pattern
- Snapshot tests in `__snapshots__/` directories
- Run individual test files: `deno test -A path/to/test_file.ts`
- Tests require `-A` (all permissions) flag

Note: Some tests will always fail when run locally (they will work in CI). Known
error messages which can be ignored locally:

- `Could not find server address`
- `Text file busy (os error 26)`

## Fresh 2.0 vs Legacy Differences

### Fresh 2.0 Project Structure

```
project/
├── routes/           # File-system routes
├── islands/          # Interactive client components
├── static/           # Static assets
├── main.ts          # Server entry (App setup)
├── client.ts        # Client entry (CSS imports)
├── vite.config.ts   # Vite configuration
└── deno.json        # Deno configuration
```

### API Changes in Fresh 2.0

- **Unified middleware signatures**: Single context parameter instead of
  `(req, ctx)`
- **Error handling**: Throw `HttpError(404)` instead of `ctx.renderNotFound()`
- **Context changes**: `ctx.info.remoteAddr` instead of `ctx.remoteAddr`
- **Unified error pages**: Single `_error.tsx` instead of separate `_404.tsx`
  and `_500.tsx`
- **Handler data passing**: Return `{ data: {...} }` instead of using
  `ctx.render(data)`

### Tailwind CSS Integration

- **Fresh 2.0**: Use `@tailwindcss/vite` plugin in `vite.config.ts` (Tailwind
  v4)
- **Legacy mode**: Use `@fresh/plugin-tailwindcss` or
  `@fresh/plugin-tailwindcss-v3`

## Contributing

For contributors working on Fresh itself:

- **Required check**: Run `deno task ok` before submitting PRs
- **Local development**: Workspace automatically links packages for testing
- **Testing changes**: Use `deno task www` (docs site) and `deno task demo`
  (Vite plugin)
- **External testing**: Use `links` in `deno.json` to override JSR packages with
  local ones
- **Documentation**: See
  [Contributing Guide](https://fresh.deno.dev/docs/contributing) for detailed
  setup instructions

## Code Conventions

- Uses Preact as the React-like library
- JSX with precompilation enabled
- TypeScript throughout with strict type checking
- File-system routing follows Next.js conventions
- Island components for client-side interactivity
- Middleware follows standard HTTP middleware patterns
