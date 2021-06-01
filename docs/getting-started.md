# Getting Started

Welcome to the `fresh` documentation.

## Requirements

The documentation assumes you have Deno 1.9.2 or later, and `deployctl` 0.3.0
installed.

To install Deno, follow the installation instructions in the manual:
https://deno.land/manual/getting_started/installation

To install `deployctl`, follow the installation instructions here:
https://deno.land/x/deploy#install

## Setup

`fresh` comes with a CLI tool, conveniently also called `fresh`. It is used to
scaffold new projects and generate the route manifest. You will only need this
tool if you are creating a new project, or are creating or moving pages around
inside an existing project. The `fresh` CLI is not required for most development
or in CI, as `fresh` does not have a build step. To install `fresh`:

```
deno install -A -f --no-check https://raw.githubusercontent.com/lucacasonato/fresh/main/cli.ts
```

## Creating a new project

Creating a new project can be done as follows:

```
fresh init my-project
```

The first argument passed to `fresh init` (in the above case `my-project`), is
the path to a folder you would like to initalize a `fresh` project in. To
initalize a project in the current working directory, pass `.` as the first
argument.

## Structure of a project

Initalizing a project will generate multiple files. For now the most important
files are `main.ts`, `routes.gen.ts`, and the pages and api routes in the
`pages` subfolder.

The `main.ts` file is the entrypoint to your project. It is the file you link in
Deno Deploy, or run locally with `deployctl`.

The `routes.gen.ts` file is a manifest of all pages and api routes in a project.
When moving around or creating new pages, this file needs to be updated. This is
done automatically when you run the `fresh routes` command. You never have to
edit this file manually.

The files in the `pages` subfolder describe the HTML pages and API endpoints of
your application. Files inside the `pages/api` subdirectory are treated as API
routes, while all other files are treated as possibly dynamic HTML pages.

## File system routing

The naming and location of files in the `pages` folder is important because they
are used to specify the route where a specific API endpoint or HTML page is
available. This concept is called filesystem routing.

As an example, the HTML page described by `index.tsx` would be served at `/`,
while the `about.tsx` page would be served at `/about`. This filesystem routing
is also capable of dynamic path segments: `/posts/[post].jsx` would be be used
for requests to `/posts/foo`, `/posts/bar`, or `/posts/baz`, but not for
`/posts/foo/comments` (that would be matched by `/posts/[post]/comments.tsx`).
Multi-level dynamic segments are also possible: `/[owner]/[repo]/[...path]`
would match `/denoland/deno/README.md` and `/lucacasonato/fresh/cli/build.rs`.
