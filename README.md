[Documentation](#documentation) | [Getting started](#getting-started)

# fresh

<img align="right" src="./www/static/logo.svg" height="150px" alt="the fresh logo: a sliced lemon dripping with juice">

**Fresh** is a next generation web framework, built for speed, reliability, and
simplicity.

Some stand-out features:

- Just-in-time rendering on the edge.
- Island based client hydration for maximum interactivity.
- Zero runtime overhead: no JS is shipped to the client by default.
- No build step.
- No configuration necessary.
- TypeScript support out of the box.
- File-system routing à la Next.js.

## 📖 Documentation

The [documentation](https://fresh.deno.dev/docs/) is available on
[fresh.deno.dev](https://fresh.deno.dev/).

## 🚀 Getting started

Install [Deno CLI](https://deno.land/) version 1.23.0 or higher.

You can scaffold a new project by running the Fresh init script. To scaffold a
project in the `my-project` folder, run the following:

```sh
deno run -A -r https://fresh.deno.dev my-project
```

Then navigate to the newly created project folder:

```
cd my-project
```

From within your project folder, start the development server using the
`deno task` command:

```
deno task start
```

Now open http://localhost:8000 in your browser to view the page. You make
changes to the project source code and see them reflected in your browser.

To deploy the project to the live internet, you can use
[Deno Deploy](https://deno.com/deploy):

1. Push your project to GitHub.
2. [Create a Deno Deploy project](https://dash.deno.com/new).
3. [Link][https://deno.com/deploy/docs/projects#enabling] the Deno Deploy
   project to the **`main.ts`** file in the root of the created repository.
4. The project will be deployed to a public $project.deno.dev subdomain.

For a more in-depth getting started guide, visit the
[Getting Started](https://fresh.deno.dev/docs/getting-started) page in the Fresh
docs.
