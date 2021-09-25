# Project strcture

Initalizing a fresh project will generate multiple files. For now the most
important files are `main.ts`, `routes.gen.ts`, and the pages and api routes in
the `pages` subfolder.

The `main.ts` file is the entrypoint to your project. It is the file you link in
Deno Deploy, or run locally with the `deno` CLI.

The `routes.gen.ts` file is a manifest of all pages and api routes in a project.
When moving around or creating new pages, this file needs to be updated. This is
done automatically when you run the `fresh routes` command. You never have to
edit this file manually.

The files in the `pages` subfolder describe the HTML pages and API endpoints of
your application. All pages can act as both API endpoints and possibly dynamic
HTML pages. More info about how the `pages` subfolder works can be found on the
[file system routing](./file-system-routing.md) page.

Finally there is a `deps.ts` and `api_deps.ts`. These files are the central
location for all external imports. The `deps.ts` file is used for runtime
dependencies (ones that are used both on the server and on the client), and the
`api_deps.ts` file is used for server only dependencies (for example ones used
in API routes).
