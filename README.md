# fresh

<img align="right" src="./www/static/logo.svg" height="150px" alt="the fresh logo: a sliced lemon dripping with juice">

The next-gen web framework.

Fresh is a next generation web framework, built for speed, reliability, and
simplicity. Some stand out features:

- Just-in-time rendering on the edge.
- Island based client hydration for maximum interactivity.
- Zero runtime overhead: no JS is shipped to the client by default.
- No build step.
- No configuration necessary.
- TypeScript support out of the box.
- File-system routing à la Next.js

## Documentation

The [documentation](https://fresh.deno.dev/docs/) is available on
[fresh.deno.dev](https://fresh.deno.dev/).

## Getting started

You can scaffold a new project by running the Fresh init script. To scaffold a
project in the `myproject` folder, run the following:

```sh
deno run -A -r https://fresh.deno.dev my-project
```

To now start the project, use `deno task`:

```
deno task start
```

To deploy the script to [Deno Deploy](https://deno.com/deploy), push your
project to GitHub, [create a Deno Deploy project](https://dash.deno.com/new),
and link it to the **`main.ts`** file in the root of the created repository.

For a more in-depth getting started guide, visit the
[Getting Started](https://fresh.deno.dev/docs/getting-started) page in the Fresh
docs.
