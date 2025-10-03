---
description: |
  Guidelines and resources for contributing to Fresh.
---

# Contributing

We appreciate your interest in contributing to Fresh! This guide provides
information about how to get started with developing Fresh locally and
submitting contributions.

## Quick Start

Before submitting a pull request, please ensure your changes pass all checks:

```sh Terminal
deno task ok
```

This command runs formatting checks, linting, type checking, and tests.

## Repository Structure

Fresh is organized as a monorepo with multiple packages:

- **`packages/fresh/`** - Core Fresh framework (`@fresh/core`)
- **`packages/plugin-vite/`** - Vite integration plugin (default build system)
- **`packages/plugin-tailwindcss/`** - Tailwind CSS v4 plugin (legacy mode only)
- **`packages/plugin-tailwindcss-v3/`** - Tailwind CSS v3 plugin (legacy mode
  only)
- **`packages/init/`** - Fresh project scaffolding tool
- **`packages/update/`** - Fresh update utilities
- **`www/`** - Fresh documentation website

## Development Workflow

1. **Fork and clone** the Fresh repository
2. **Make your changes** in the appropriate package
3. **Test your changes** using the methods described in the next sections
4. **Run checks** with `deno task ok` to ensure everything passes
5. **Submit a pull request** with a clear description of your changes

## Getting Help

- **Documentation**: Browse the
  [Fresh documentation](https://fresh.deno.dev/docs)
- **Issues**: Report bugs or request features on
  [GitHub Issues](https://github.com/denoland/fresh/issues)
- **Discussions**: Join conversations on
  [GitHub Discussions](https://github.com/denoland/fresh/discussions)
- **Discord**: Connect with the community on the
  [Deno Discord server](https://discord.gg/deno)

## Next Steps

- [**Local Development**](./local-development) - Set up your development
  environment
- [**Testing Changes**](./testing) - Learn how to test your contributions

Thank you for contributing to Fresh! 🍋
