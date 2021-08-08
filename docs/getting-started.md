# Getting Started

Welcome to the `fresh` documentation.

## Requirements

The documentation assumes you have Deno 1.12.0 or later installed.

To install Deno, follow the installation instructions in the manual:
https://deno.land/manual/getting_started/installation

## Setup

`fresh` comes with a CLI tool, conveniently also called `fresh`. It is used to
scaffold new projects and generate the route manifest. You will only need this
tool if you are creating a new project, or are creating or moving pages around
inside an existing project. The `fresh` CLI is not required for most development
or in CI, as `fresh` does not have a build step. To install `fresh`:

```
deno install -A -f --no-check -n fresh https://raw.githubusercontent.com/lucacasonato/fresh/main/cli.ts
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

Now move into the directory you just created / initalized (for example
`cd my-project`).

To learn more about how projects are structured, take a look at the
[Project Structure](./project-structure.md) documentation.

## Running the project locally

You can now run your new project locally using the `deno` CLI:

```
deno run -A --unstable --watch main.ts
```

The `--watch` option will cause your script to be reloaded on any changes to the
source. If you do not want this you can omit the `--watch` option.

After you have started the project, you can view it in your browser at
http://localhost:8080. You will first get served a JIT server rendered page,
which will get hydrated using client side JS after a few moments.

## Deploying the project to Deno Deploy

To deploy your project you will need to push the source code to either a web
server, or GitHub.com. Fresh currently only supports public GitHub repositories.
For this guide we will use GitHub.com and the Deno Deploy GitHub integration.

First create a new repository on GitHub.com with the same account you signed up
to Deno Deploy with (or an organization you can access from that account). Then
follow the setup instructions for GitHub on your machine, and push your code
into the repository.

Now go back to GitHub and open the `main.ts` file that you pushed. Copy the URL
in the address bar. It should look something like this:
`https://github.com/lucacasonato/fresh/blob/main/example/main.ts`. Visit your
project on dash.deno.com, enter the URL you copied into the
`Link GitHub repository` input box in the project settings, and press `Link`.
You might need to grant the Deno Deploy app permission to the repository at this
point (follow prompts on the Deno Deploy dashboard).

Your project is now linked to Deno Deploy and will automatically deployed on
every push. Your project now has a URL you can visit to view your site live.
Example: https://fresh.deno.dev

## Next steps

Now that the project is deployed, it is time to make some changes to the default
project. For that read the guides on
[project structure](./project-structure.md), [data fetching](./data-fetching.md)
and [file system routing](./file-system-routing.md)
