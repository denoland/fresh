---
description: |
  The Builder class is used to generate optimized assets for production.
---

The `Builder` class in Fresh is where you'll do everything related to builds.
You'll typically find it being created inside your project's `dev.ts` file.

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
