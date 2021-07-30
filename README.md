> :warning: DO NOT USE. WHILE CERTAIN FEATURES MIGHT BE WORKING, MANY THINGS ARE
> STILL SUBJECT TO CHANGE AT ANY TIME.

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
- Zero config necessary
- JIT rendering on the edge
- Tiny (example is 0-3KB of runtime JS)<sup>1</sup>
- Optional client side hydration
- TypeScript out of the box
- File-system routing à la Next.js

_<sup>1</sup> Client side hydration can be disabled per page. This results in
**no JS** being shipped to the client._

## Install

To install, run the following command. This will add `fresh` CLI to your PATH.
Make sure to have Deno 1.10.3 or later installed.

```sh
deno install -A -f --no-check -n fresh https://raw.githubusercontent.com/lucacasonato/fresh/main/cli.ts
```

## Getting started

The `fresh` CLI can scaffold a new project for you. To scaffold a project in the
`myproject` folder, run the following:

```sh
fresh init myproject
```

To now start the project, call `deno run`:

```
deno run -A --unstable --config tsconfig.json --watch main.ts
```

To deploy the script to [Deno Deploy](https://deno.com/deploy), push your
project to GitHub, create a `fresh` project, and link it to `main.ts` file in
the created repository.

For a more in-depth getting started guide, visit the
[Getting Started](./docs/getting-started.md) page in the `fresh` docs.
