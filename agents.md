# Fresh

Fresh is a next-generation web framework for Deno. It is designed to be fast,
reliable, and simple.

Remember this is Fresh 2, which uses Vite by default.

Please make yourself familiar with Fresh 2 and the changes compared to Fresh 1
here: https://fresh.deno.dev/docs/latest/examples/migration-guide

## Project Overview

This repository contains the source code for the Fresh framework, as well as the
official website for the project. The repository is a monorepo, with the
framework code located in the `packages` directory and the website code in the
`www` directory.

The Fresh framework is built on top of Preact and uses a file-system-based
routing system. It also has built-in support for TypeScript and JSX. The
framework is designed to be as lightweight as possible, with a focus on
performance and ease of use.

The website is a Fresh application that serves as the documentation and showcase
for the framework. It is a good example of how to build a real-world application
with Fresh.

## Building and Running

The project uses `deno task` for scripting. The following commands are
available:

- `deno task test`: Runs the test suite.
- `deno task www`: Starts the development server for the website.
- `deno task build-www`: Builds the website for production.
- `deno task check:types`: Type-checks the code.
- `deno task ok`: Runs a comprehensive check that includes formatting, linting,
  type-checking, and tests.

## Development Conventions

The project follows the standard Deno conventions. All code is written in
TypeScript and formatted with `deno fmt`. The project also uses `deno lint` to
enforce a consistent coding style.

The project has a comprehensive test suite that is run on every commit. All new
features and bug fixes should be accompanied by tests.

The project uses a monorepo structure, with each package located in its own
directory under the `packages` directory. The website is also a package, located
in the `www` directory.

The project uses a file-system-based routing system. Each route is a file in the
`routes` directory. The file name determines the route's path.

The project uses Preact for the view layer. All components are written in JSX.

The project uses islands for client-side interactivity. An island is a component
that is rendered on the server and then hydrated on the client. This allows for
a fast first-page load, while still providing a rich interactive experience.
