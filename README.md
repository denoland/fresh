[Documentation](#-documentation) | [Getting started](#-getting-started) |
[API Reference](https://deno.land/x/fresh?doc)

# fresh

<img align="right" src="https://fresh.deno.dev/logo.svg" height="150px" alt="The Fresh logo: a sliced lemon dripping with juice">

**Fresh** is a next generation web framework, built for speed, reliability, and
simplicity.

Some stand-out features:

- Just-in-time rendering on the edge.
- Island based client hydration for maximum interactivity.
- Zero runtime overhead: no JS is shipped to the client by default.
- No configuration necessary.
- TypeScript support out of the box.
- File-system routing à la Next.js.

## 📖 Documentation

The [documentation](https://fresh.deno.dev/docs/introduction) is available on
[fresh.deno.dev](https://fresh.deno.dev/).

## 🚀 Getting started

Install the latest [Deno CLI](https://deno.land/) version.

You can scaffold a new project by running the Fresh init script. To scaffold a
project run the following:

```sh
deno run -A -r https://fresh.deno.dev
```

Then navigate to the newly created project folder:

```
cd deno-fresh-demo
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
3. [Link](https://deno.com/deploy/docs/projects#enabling) the Deno Deploy
   project to the **`main.ts`** file in the root of the created repository.
4. The project will be deployed to a public $project.deno.dev subdomain.

For a more in-depth getting started guide, visit the
[Getting Started](https://fresh.deno.dev/docs/getting-started) page in the Fresh
docs.

## Contributing

We appreciate your help! To contribute, please read our
[contributing guideline](./.github/CONTRIBUTING.md).

## Adding your project to the showcase

If you feel that your project would be helpful to other Fresh users, please
consider putting your project on the
[showcase](https://fresh.deno.dev/showcase). However, websites that are just for
promotional purposes may not be listed.

To take a screenshot, run the following command.

```sh
deno task screenshot [url] [your-app-name]
```

Then add your site to
[showcase.json](https://github.com/denoland/fresh/blob/main/www/data/showcase.json),
preferably with source code on GitHub, but not required.

## Badges

![Made with Fresh](./www/static/fresh-badge.svg)

```md
[![Made with Fresh](https://fresh.deno.dev/fresh-badge.svg)](https://fresh.deno.dev)
```

```html
<a href="https://fresh.deno.dev">
  <img
    width="197"
    height="37"
    src="https://fresh.deno.dev/fresh-badge.svg"
    alt="Made with Fresh"
  />
</a>
```

![Made with Fresh(dark)](./www/static/fresh-badge-dark.svg)

```md
[![Made with Fresh](https://fresh.deno.dev/fresh-badge-dark.svg)](https://fresh.deno.dev)
```

```html
<a href="https://fresh.deno.dev">
  <img
    width="197"
    height="37"
    src="https://fresh.deno.dev/fresh-badge-dark.svg"
    alt="Made with Fresh"
  />
</a>
```

## Hashtags

Use the following hashtags in your social media posts that reference Fresh and
as Topics in the About section of your GitHub repos that contain Fresh code. It
will assure maximum visibility for your posts and code, and promote Fresh
development ecosystem visibility.

- #denofresh
- #deno

Github repo Topics will not include the hash symbol.
