---
description: |
  Various projects can integrate into Fresh to easily add functionality to your
  project.
---

This section of the docs showcases modules or other projects that integrate with
Fresh. These integrations can be used to add functionality to your project.

## `fresh_charts`

Fresh charts allows for easy integration of [Chart.js][chart-js] charts into
your Fresh project. It provides a `Chart` JSX component that can be used to
render charts on the server and client.

A live demo can be found here: https://fresh-charts.deno.dev/

Documentation for the module can be found here: https://deno.land/x/fresh_charts

[chart-js]: https://www.chartjs.org/ "Chart.js"

## `fresh_marionette`

Fresh Marionette allows you to start writing end 2 end browser tests in your
Fresh projects with a single import. Then you can run those browser tests in a
GitHub Actions workflow.

Documentation for the module can be found here:
https://deno.land/x/fresh_marionette

An example project that runs the tests in a GitHub Actions workflow:
https://marionette.deno.dev

Fresh Marionette works with VSCode too! - https://youtu.be/OG77NdqL164

## `fresh_tailwind`

This plugin adds Tailwind CSS support to Fresh. It includes a PostCSS-powered
plugin which can compile Tailwind styles just-in-time or during the
ahead-of-time build process.

An example Fresh project with Tailwind is deployed at
https://fresh-tailwind.deno.dev (with
[source available on GitHub](https://github.com/jasonjgardner/fresh_tailwind_example)).

Documentation for the module and its usage can be found here:
https://deno.land/x/fresh_tailwind

## `fresh_images`

The Fresh Images plugin adds the ability to transform images in your Fresh
project, on-the-fly or AOT. The plugin exports a helper JSX component and
`asset` function to apply transformation URL parameters to image paths.

Middleware in Fresh is used to load and modify the image behind the URL route.
The middleware also includes the ability to provide rate-limiting, hotlink
protection and caching to the transformed images. The Cache API is used where
available, with the option to fallback to caching in Deno KV storage.

The plugin repository includes a small set of default transformations and
exposes an API which allows implementing custom transformations.

Documentation for the module can be found here: https://deno.land/x/fresh_images

A demo can be found at: https://fresh-images.deno.dev/
