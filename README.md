# fresh

Preact, but super edgy.

Fresh is a web framework that lets you build projects very fast, highly dynamic,
and without the need of a build step. Fresh embraces isomorphic JavaScript like
never before. Write a JSX component, have it render on the edge just-in-time,
and then enhance it with client side JS for great interactivity.

Fresh does not have a build step - you write your code, deploy it to 
[Deno Deploy](https://deno.com/deploy), and from there everything is handled by
the framework.

- No build step
- Zero config
- JIT rendering on the edge
- Tiny (example is 3KB of JS)
- Client side hydration
- TypeScript out of the box
- File-system routing à la Next.js

## Install

To install, run the following command. This will add `fresh` CLI to your PATH.
Make sure to have Deno 1.9.1 or later installed.

```sh
deno install -A -f https://deno.land/x/fresh/cli.ts
```

## Getting started

The `fresh` CLI can scaffold a new project for you. To scaffold a project in the
`myproject` folder, run the following:

```sh
fresh init myproject
```

To now start the project, use [`deployctl`](https://deno.land/x/deploy):

```
deployctl run --no-check --watch server.ts
```

To deploy the script to [Deno Deploy](https://deno.com/deploy), push your
project to GitHub, create a `fresh` project, and link it to `server.ts` file in
the created repository.

To learn more about how to use `fresh`, visit the documentation.
