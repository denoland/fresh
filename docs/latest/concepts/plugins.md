---
description: Plugins can add new functionality to Fresh without requiring significant complexity.
---

Plugins can dynamically add new functionality to Fresh without exposing
significant complexity to the user. Users can add plugins by importing and
initializing them in their `main.ts` file:

```ts main.ts
import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";

import twindPlugin from "$fresh/plugins/twind.ts";
import twindConfig from "./twind.config.js";

await start(manifest, {
  plugins: [
    // This line configures Fresh to use the first-party twind plugin.
    twindPlugin(twindConfig),
  ],
});
```

Currently, the only available first-party plugin is the Twind plugin.
Third-party plugins are also supported - they can be imported from any HTTP
server, like any other Deno module.

Plugin hooks are executed in the order that the plugins are defined in the
`plugins` array. This means that the first plugin in the array will be executed
first, and the last plugin in the array will be executed last. For many plugins,
this does not matter, but for some plugins it may.

## Creating a plugin

Fresh plugins are in essence a collection of hooks that allow the plugin to hook
into various systems inside of Fresh. Currently only a `render` hook is
available (explained below).

A Fresh plugin is just a JavaScript object that conforms to the
[Plugin](https://deno.land/x/fresh/server.ts?s=Plugin) interface. The only
required property of a plugin is its name. Names must only contain the
characters `a`-`z`, and `_`.

```ts
import { Plugin } from "$fresh/server.ts";

const plugin: Plugin = {
  name: "my_plugin",
};
```

A plugin containing only a name is technically valid, but not very useful. To be
able to do anything with a plugin, it must register some hooks, middlewares, or
routes.

### Hook: `render`

The render hook allows plugins to:

- Control timing of the synchronous render of a page.
- Inject additional CSS and JS into the rendered page.

This is commonly used to set thread local variables for the duration of the
render (for example preact global context, preact option hooks, or for style
libraries like Twind). After render is complete, the plugin can inject inline
CSS and JS modules (with attached state) into the page.

The render hook is called with the
[`PluginRenderContext`](https://deno.land/x/fresh/server.ts?s=PluginRenderContext)
object, which contains a `render()` method. This method must be invoked during
the render hook to actually render the page. It is a terminal error to not call
the `render()` method during the render hook.

The `render()` method returns a
[`PluginRenderFunctionResult`](https://deno.land/x/fresh/server.ts?s=PluginRenderFunctionResult)
object which contains the HTML text of the rendered page, as well as a boolean
indicating whether the page contains any islands that will be hydrated on the
client.

The `render` hook needs to synchronously return a
[`PluginRenderResult`](https://deno.land/x/fresh/server.ts?s=PluginRenderResult)
object. Additional CSS and JS modules can be added to be injected into the page
by adding them to `styles` and `scripts` arrays in this object.

`styles` are injected into the `<head>` of the page as inline CSS. Each entry
can define the CSS text to inject, as well as an optional `id` for the style
tag, and an optional `media` attribute for the style tag.

`scripts` define JavaScript/TypeScript modules to be injected into the page. The
possibly loaded modules need to be defined up front in the `Plugin#entrypoints`
property. Each defined module must be a JavaScript/TypeScript module that has a
default export of a function that takes one (arbitrary) argument, and returns
nothing (or a promise resolving to nothing). Fresh will call this function with
the state defined in the `scripts` entry. The state can be any arbitrary JSON
serializable JavaScript value.

For an example of a plugin that uses the `render` hook, see the first-party
[Twind plugin](https://github.com/denoland/fresh/blob/main/plugins/twind.ts).

### Hook: `renderAsync`

This hook is largely the same as the `render` hook, with a couple of key
differences to make asynchronous style and script generation possible. It must
asynchronously return its
[`PluginRenderResult`](https://deno.land/x/fresh/server.ts?s=PluginRenderResult),
either from an `async/await` function or wrapped within a promise.

The render hook is called with the
[`PluginAsyncRenderContext`](https://deno.land/x/fresh/server.ts?s=PluginAsyncRenderContext)
object, which contains a `renderAsync()` method. This method must be invoked
during the render hook to actually render the page. It is a terminal error to
not call the `renderAsync()` method during the render hook.

This is useful for when plugins are generating styles and scripts with
asynchronous dependencies based on the `htmlText`. Unlike the synchronous render
hook, async render hooks for multiple pages can be running at the same time.
This means that unlike the synchronous render hook, you can not use global
variables to propagate state between the render hook and the renderer.

The `renderAsync` hooks start before any page rendering occurs, and finish after
all rendering is complete -- they wrap around the underlying JSX->string
rendering, plugin `render` hooks, and the
[`RenderFunction`](https://deno.land/x/fresh/server.ts?s=RenderFunction) that
may be provided to Fresh's `start` entrypoint in the `main.ts` file.

### Routes and Middlewares

You can create routes and middlewares that get loaded and rendered like the
normal [routes](/docs/concepts/routes) and
[middlewares](/docs/concepts/middleware).

The plugin routes and middlewares need a defined path in the format of a file
name without a filetype inside the routes directory(E.g. `blog/index`,
`blog/[slug]`).

For more examples see the [Concepts: Routing](/docs/concepts/routing) page.

To create a middleware you need to create a `MiddlewareHandler` function.

And to create a route you can create both a Handler and/or component.
