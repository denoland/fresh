---
description: |
  Create a new Fresh project by running the Fresh project creation tool. This
  scaffolds out the various files and folders a Fresh project needs.
---

New Fresh projects can be created by using the Fresh project creation tool. It
will scaffold out a new project with some example files to get you started.

To create a new project, run:

```sh Terminal
deno run -A -r jsr:@fresh/init
cd fresh-project
deno task dev
```

This will scaffold out the new project, then switch into the newly created
directory, and then start the development server.

This will create a directory containing some files and directories. There are 4
files that are strictly necessary to run a Fresh project:

- **`dev.ts`**: This is the development entry point for your project. This is
  the file that you run to start your project.
- **`main.ts`**: This is the production entry point for your project. It is the
  file that you link to Deno Deploy.

A **`deno.json`** file is also created in the project directory. This file does
two things:

- It defines the "imports" field. This is an
  [import map](https://docs.deno.com/runtime/manual/basics/import_maps) that is
  used to manage dependencies for the project. This allows for easy importing
  and updating of dependencies.
- It registers a "dev" [task](https://deno.land/manual/tools/task_runner) to run
  the project without having to type a long `deno run` command.

Two important folders are also created that contain your routes and islands
respectively:

- **`routes/`**: This folder contains all of the routes in your project. The
  names of each file in this folder correspond to the path where that page will
  be accessed. Code inside of this folder is never directly shipped to the
  client. You'll learn more about how routes work in the next section.
- **`islands/`**: This folder contains all of the interactive islands in your
  project. The name of each file corresponds to the name of the island defined
  in that file. Code inside of this folder can be run from both client and
  server. You'll learn more about islands later in this chapter.

Finally a **`static/`** folder is created that contains static files that are
automatically served "as is". We'll
[learn more about static files](../concepts/static-files) in a later chapter.

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
