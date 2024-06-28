---
description: |
  Create a new Fresh project by running the Fresh project creation tool. This
  scaffolds out the various files and folders a Fresh project needs.
---

New Fresh projects can be created by using the Fresh project creation tool. It
will scaffold out a new project with some example files to get you started.

> [info]: Make sure to have the [latest Deno](https://deno.com/) version
> installed before continuing.

To create a new project, run:

```sh Terminal
deno run -A -r jsr:@fresh/init
cd fresh-project
```

This will scaffold out the new project, then switch ito the newly created
directory. The folder structure of the newly created Fresh project will look
roughly like this:

```sh
fresh-project/
├── components/         # Place components that should be re-used here
|   └── Button.tsx      # A re-usable button component
├── islands/            # Client-side components to run in the browser
|   └── Counter.tsx     # An example Counter island component
├── routes/             # Place all your routes here
|   ├── _app.tsx        # App wrapper template, the outer HTML structure
|   |                   # that will always be included on every page.
|   ├── api/
|   |   └── [name].tsx  # /api/:name route example that responds with
|   |                   # plain text and the name you pass in the url
|   └── index.tsx       # / Route
├── static/             # Place static files (images, videos, etc) here
|   └── ...
├── deno.json      # Contains project dependencies, tasks, etc
├── dev.ts         # Development entry point
└── main.tsx       # Production entry point (use this for Deno Deploy)
```

The most important fields in the `deno.json` file are the `"imports"` and
`"tasks"` field.

- `"imports"`: An
  [import map](https://docs.deno.com/runtime/manual/basics/import_maps) for
  managing dependencies.
- `"tasks"`: Registers [tasks](https://deno.land/manual/tools/task_runner) for
  your project. Run `deno task` to view all available tasks.

> [info]: Fresh requires the following permissions to function:
>
> - **`--allow-net`**: Required to start the HTTP server.
> - **`--allow-read`**: Required to read (static) files from disk.
> - **`--allow-env`**: Required to read environment variables that can be used
>   to configure your project.
> - **`--allow-run`**: Required to shell out to `deno` and `esbuild` under the
>   hood generate the browser assets.
>
> The tasks defined in `deno.json` have `-A` which allows all permissions.
