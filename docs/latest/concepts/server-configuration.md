---
description: |
  The ability to configure the core Fresh server leads to its flexibility.
---

In this page we discuss how the server can be configured during startup.

The signature of the primary method looks like this:

```ts
export async function start(routes: Manifest, opts: StartOptions = {});
```

## Options

`Manifest` comes from `fresh.gen.ts`, so nothing to do there. `opts` is where
things get interesting. `StartOptions` looks like this:

```
export type StartOptions = ServeInit & FreshOptions;
```

The good stuff is really in...

```ts
export interface FreshOptions {
  render?: RenderFunction;
  plugins?: Plugin[];
  staticDir?: string;
  router?: RouterOptions;
}
```

And for brevity here are the remaining two types:

```ts
export type RenderFunction = (
  ctx: RenderContext,
  render: InnerRenderFunction,
) => void | Promise<void>;

export interface RouterOptions {
  /**
   *  @default {false}
   */
  trailingSlash?: boolean;
}
```

## Plugins

See the [docs](/docs/concepts/plugins) on this topic for more detail. But for
completion, you can do something like this to load plugins:

```ts
await start(manifest, { plugins: [twindPlugin(twindConfig)] });
```

## StaticDir

This allows you to specify the location where your site's static assets are
stored. Here's an example:

```ts
await start(manifest, { staticDir: "./custom_static" });
```

## Render

This is by far the most complicated option currently available. It allows you to
configure how your components get rendered.

A detailed, concrete example of this is changing the language of the `<html>`
tag. See the documentation [here](/docs/examples/setting-the-language).

## RouterOptions

### TrailingSlash

By default Fresh uses URLs like `https://www.example.com/about`. If you'd like,
you can configure this to `https://www.example.com/about/` by using the
`trailingSlash` setting.

```ts
await start(manifest, { router: { trailingSlash: true } });
```
