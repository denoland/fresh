`fresh` comes with a CLI tool, conveniently also called `fresh`. It is used to
scaffold new projects and generate the fresh manifest (more on that later). This
tool is only needed to create a new project, or to re-generate the fresh
manifest after you have added, removed, or renamed a pages or islands in an
existing project.

The CLI tool is not required for most development or in CI, as `fresh` does not
have a build step. This means that if you are only doing some light editing on
an existing project, you do not need to install or use the `fresh` CLI.

To install the `fresh` CLI:

```
deno install -A -f --no-check -n fresh -r https://raw.githubusercontent.com/lucacasonato/fresh/main/cli.ts
```

The tool should now be available as `fresh` in your terminal. To try out if
installation was successful you can just run `fresh` without any arguments:

```
$ fresh
fresh 0.1.0
The next-gen web framework.

To initalize a new project:
  fresh init ./myproject

To (re-)generate the manifest file:
  fresh manifest

SUBCOMMANDS:
    init      Initalize a fresh project
    manifest  (Re-)generate the manifest file
```
