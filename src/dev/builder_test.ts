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
      build: {
        outDir: path.join(tmp, "dist"),
      },
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
      build: {
        outDir: path.join(tmp, "dist"),
      },
    });
    await builder.build(app);

    const snapshotJson = await Deno.readTextFile(
      path.join(tmp, "dist", "manifest.ts"),
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
  sanitizeOps: false,
  sanitizeResources: false,
});

// Issue https://github.com/denoland/fresh/issues/2599
Deno.test({
  name: "Builder - hashes CSS urls by default",
  fn: async () => {
    const builder = new Builder();
    const tmp = await Deno.makeTempDir();
    await Deno.writeTextFile(
      path.join(tmp, "foo.css"),
      `:root { --icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgb(76, 154.5, 137.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E"); }`,
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
    expect(css).toEqual(
      `:root { --icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgb(76, 154.5, 137.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E"); }`,
    );
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
      build: {
        outDir: path.join(tmp, "dist"),
      },
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

Deno.test({
  name: "Builder - exclude files",
  fn: async () => {
    const logs: string[] = [];
    const builder = new Builder();

    // String
    builder.onTransformStaticFile(
      { pluginName: "A", filter: /\.css$/, exclude: ["foo.css"] },
      (args) => {
        logs.push(`A: ${path.basename(args.path)}`);
      },
    );

    // Regex
    builder.onTransformStaticFile(
      { pluginName: "B", filter: /\.css$/, exclude: [/foo\.css$/] },
      (args) => {
        logs.push(`B: ${path.basename(args.path)}`);
      },
    );

    // Glob
    builder.onTransformStaticFile(
      { pluginName: "C", filter: /\.css$/, exclude: ["**/foo.css"] },
      (args) => {
        logs.push(`C: ${path.basename(args.path)}`);
      },
    );

    const tmp = await Deno.makeTempDir();
    await Deno.writeTextFile(path.join(tmp, "foo.css"), "body { color: red; }");
    await Deno.writeTextFile(
      path.join(tmp, "bar.css"),
      "body { color: blue; }",
    );
    const app = new App({
      staticDir: tmp,
      build: {
        outDir: path.join(tmp, "dist"),
      },
    });
    await builder.build(app);

    expect(logs).toEqual(["A: bar.css", "B: bar.css", "C: bar.css"]);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
