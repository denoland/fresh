> :warning: Not yet 1.0. Many things are subject to change. Documentation is
> lacking in many places. Try it out and give us feedback!

# fresh

<img align="right" src="./www/static/logo.svg" height="150px" alt="the fresh logo: a sliced lemon dripping with juice">

The next-gen web framework.

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

## Documentation

The [documentation](https://fresh.deno.dev/docs/) is available on
[fresh.deno.dev](https://fresh.deno.dev/).

## Getting started

You can scaffold a new project by running the Fresh init script. To scaffold a
project in the `myproject` folder, run the following:

```sh
deno run -A --no-check https://raw.githubusercontent.com/lucacasonato/fresh/main/init.ts my-project
```

To now start the project, use `deno task`:

```
deno task start
```

To deploy the script to [Deno Deploy](https://deno.com/deploy), push your
project to GitHub, create a Fresh project, and link it to **`main.ts`** file in
the created repository.

For a more in-depth getting started guide, visit the
[Getting Started](https://fresh.deno.dev/docs/getting-started) page in the Fresh
docs.
