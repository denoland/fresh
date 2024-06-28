# Examples for Fresh

This is an package contains examples for using Fresh with
[JSR](https://jsr.io/).

Learn more about the Fresh framework here:
[https://fresh.deno.dev/](https://fresh.deno.dev/)

## Usage: Island example

```tsx
import { App } from "fresh";
// Import the island function
import { DemoIsland } from "jsr:@fresh/examples/island";

export const app = new App({ root: import.meta.url })
  .use(staticFiles());

// Register the island
app.island(
  // Module specifier for esbuild, could also be a file path
  "jsr:@fresh/examples/island",
  // Name of the island
  "DemoIsland",
  // Island component function
  DemoIsland,
);

// Use the island somewhere in your components
app.get("/", (ctx) => ctx.render(<DemoIsland />));

await app.listen();
```

## Usage: App1 or App2 example

```tsx
import { App } from "fresh";
// Import the example apps
import { app1 } from "jsr:@fresh/examples/app1";
import { app2 } from "jsr:@fresh/examples/app2";

export const app = new App({ root: import.meta.url })
  .use(staticFiles());

// Merge apps from JSR into this one
app.mountApp("/app1", app1);
app.mountApp("/app2", app1);

await app.listen();
```

## License

MIT, see the [LICENSE](./LICENSE) file.
