# Project strcture

Initalizing a fresh project will generate multiple files. For now the most
important files are `main.ts`, `fresh.gen.ts`, the route modules in the `routes`
subdirectory, and the islands in the `islands` subdirectory.

The `main.ts` file is the entrypoint to your project. It is the file you link in
Deno Deploy, or run locally with the `deno` CLI.

The `fresh.gen.ts` file is a manifest of all routes and islands in a project.
When moving around or creating new pages or islands, this file needs to be
updated. This is done automatically when you run the `fresh manifest` command.
You never have to edit this file manually.

The files in the `routes` subfolder describe the HTML pages and API endpoints of
your application. All routes can act as both API endpoints and dynamic HTML
pages. More info about how the `routes` subdirectory works can be found on the
[file system routing](./file-system-routing.md) page.

Finally there is a `client_deps.ts` and `server_deps.ts`. These files are the
central location for all external imports. The `client_deps.ts` file is used for
runtime dependencies (ones that are used both in routes and islands), and the
`server_deps.ts` file is used for server only dependencies (for example ones
used in API routes or middleware).
