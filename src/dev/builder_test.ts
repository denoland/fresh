import { expect } from "@std/expect";
import * as path from "@std/path";
import { Builder } from "./builder.ts";
import { App } from "../app.ts";
import { RemoteIsland } from "@marvinh-test/fresh-island";
import { BUILD_ID } from "../runtime/build_id.ts";

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
      buildOutDir: path.join(tmp, "dist"),
    });
    await builder.build(app);

    expect(logs).toEqual(["A", "B", "C"]);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "Builder - handles Windows paths",
  fn: async () => {
    const builder = new Builder();
    const tmp = await Deno.makeTempDir();
    await Deno.mkdir(path.join(tmp, "images"));
    await Deno.writeTextFile(
      path.join(tmp, "images", "batman.svg"),
      "<svg></svg>",
    );
    const app = new App({
      staticDir: tmp,
      buildOutDir: path.join(tmp, "dist"),
    });
    await builder.build(app);

    const snapshotJson = await Deno.readTextFile(
      path.join(tmp, "dist", "snapshot.json"),
    );
    expect(snapshotJson).toContain("/images/batman.svg");
  },
  sanitizeOps: false,
  sanitizeResources: false,
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
      buildOutDir: path.join(tmp, "dist"),
    });
    await builder.build(app);

    const css = await Deno.readTextFile(
      path.join(tmp, "dist", "static", "foo.css"),
    );
    expect(css).toContain('body { background: url("/foo.jpg?__frsh_c=');
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "Builder - can bundle islands from JSR",
  fn: async () => {
    const builder = new Builder();
    const tmp = await Deno.makeTempDir();
    const app = new App({
      staticDir: tmp,
      buildOutDir: path.join(tmp, "dist"),
    });

    app.island("jsr:@marvinh-test/fresh-island", "RemoteIsland", RemoteIsland);

    await builder.build(app);

    const code = await Deno.readTextFile(
      path.join(
        tmp,
        "dist",
        "static",
        "_fresh",
        "js",
        BUILD_ID,
        "RemoteIsland.js",
      ),
    );
    expect(code).toContain('"remote-island"');
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
