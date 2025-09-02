---
description: |
  The Builder class is used to generate optimized assets for production.
---

> [warn]: The `Builder` class was used during the alpha phase of Fresh 2 before
> the Fresh vite plugin was released. You can skip this page if you're using
> vite.

The `Builder` class is used to generate production assets of your app. You'll
typically find it being created inside your project's `dev.ts` file.

```ts dev.ts
import { Builder } from "fresh/dev";

const builder = new Builder({ target: "safari12" });

if (Deno.args.includes("build")) {
  // This creates a production build
  await builder.build();
} else {
  // This starts a development server with live reload
  await builder.listen(() => import("./main.ts"));
}
```

## Options

You can customize the builder by passing options.

```ts dev.ts
const builder = new Builder({
  // Browser target for generated code. Maps to https://esbuild.github.io/api/#target
  target?: string | string[];
  // The root directory of the project. All other paths will be resolved
  // against this if they're relative. (Default: `Deno.cwd()`)
  root?: string;
  // The path to your server entry point. (Default: `<root>/main.ts`)
  serverEntry?: string;
  // Where to write generated files when doing a production build.
  // (default: `<root>/_fresh/`)
  outDir?: string;
  // Path to static file directory. (Default: `<root>/static/`)
  staticDir?: string;
  // Path to island directory. (Default: `<root>/islands`)
  islandDir?: string;
  // Path to routes directory. (Default: `<root>/routes`)
  routeDir?: string;
  // File paths which should be ignored 
  ignore?: RegExp[];
  // Optionally generate production source maps
  // See https://esbuild.github.io/api/#source-maps
  sourceMap?: {
    kind?: boolean | 'linked' | 'inline' | 'external' | 'both';
    sourceRoot?: string;
    sourcesContent?: boolean;
  };
})
```

## Registering islands

The builder is where you'll register files that contain islands. This is the
same API that Fresh uses internally.

```ts dev.ts
const builder = new Builder();

// Path to local island
builder.registerIsland("path/to/my/Island.tsx");
// File urls work too
builder.registerIsland("file:///path/to/my/Island.tsx");
// Also islands from jsr
builder.registerIsland("jsr:@marvinh-test/fresh-island");
```

## Adding build plugins

The `Builder` has a very simple processing mechanism for static files.

```ts dev.ts
builder.onTransformStaticFile({
  pluginName: "My cool plugin",
  filter: /\.css$/,
}, (args) => {
  // Prepend `body { background: red }` to every `.css` file
  const code = `body { background: red } ${args.text}`;

  return {
    content: code,
    map: undefined, // Optional: source maps
  };
});
```

> [info]: Only static files in `static/` or the value you set `staticDir` to
> will be processed. The builder won't process anything else.

## Testing

Testing applications with the `Builder` class involves creating a build snapshot
and assigning that to each app instance.

```ts my-app.test.ts
// Best to do this once instead of for every test case for
// performance reasons.
const builder = new Builder();
const applySnapshot = await builder.build({ snapshot: "memory" });

function testApp() {
  const app = new App()
    .get("/", () => new Response("hello"))
    .fsRoutes();

  // Applies build snapshot to this app instance.
  applySnapshot(app);
  return app;
}

Deno.test("My Test", async () => {
  const handler = testApp().handler();

  const response = await handler(new Request("http://localhost"));
  const text = await response.text();

  if (text !== "hello") {
    throw new Error("fail");
  }
});
```
