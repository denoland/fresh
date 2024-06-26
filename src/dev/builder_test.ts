import { expect } from "@std/expect";
import * as path from "@std/path";
import { Builder } from "./builder.ts";
import { App } from "../app.ts";
import { RemoteIsland } from "@marvinh-test/fresh-island";

Deno.test({
  name: "Builder - chain onTransformStaticFile",
  fn: async () => {
    const logs: string[] = [];
    const builder = new Builder();
    builder.onTransformStaticFile(
      { pluginName: "A", filter: /\.css$/ },
      () => {
        logs.push("A");
      },
    );
    builder.onTransformStaticFile(
      { pluginName: "B", filter: /\.css$/ },
      () => {
        logs.push("B");
      },
    );
    builder.onTransformStaticFile(
      { pluginName: "C", filter: /\.css$/ },
      () => {
        logs.push("C");
      },
    );

    const tmp = await Deno.makeTempDir();
    await Deno.writeTextFile(path.join(tmp, "foo.css"), "body { color: red; }");
    const app = new App({
      staticDir: tmp,
      build: {
        outDir: path.join(tmp, "dist"),
      },
    });
    await builder.build(app);

    expect(logs).toEqual(["A", "B", "C"]);
  },
});

Deno.test({
  name: "Builder - hashes CSS urls by default",
  fn: async () => {
    const builder = new Builder();
    const tmp = await Deno.makeTempDir();
    await Deno.writeTextFile(
      path.join(tmp, "foo.css"),
      "body { background: url('/foo.jpg'); }",
    );
    const app = new App({
      staticDir: tmp,
      build: {
        outDir: path.join(tmp, "dist"),
      },
    });
    await builder.build(app);

    const css = await Deno.readTextFile(
      path.join(tmp, "dist", "static", "foo.css"),
    );
    expect(css).toContain('body { background: url("/foo.jpg?__frsh_c=');
  },
});

Deno.test({
  name: "Builder - can bundle islands from JSR",
  fn: async () => {
    const builder = new Builder();
    const tmp = await Deno.makeTempDir();
    const app = new App({
      staticDir: tmp,
      build: {
        outDir: path.join(tmp, "dist"),
      },
    });

    app.island("jsr:@marvinh-test/fresh-island", "RemoteIsland", RemoteIsland);

    await builder.build(app);

    const code = await Deno.readTextFile(
      path.join(tmp, "dist", "static", "RemoteIsland.js"),
    );
    expect(code).toContain('"remote-island"');
  },
});
