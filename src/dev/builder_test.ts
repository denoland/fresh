import { expect } from "@std/expect";
import * as path from "@std/path";
import { Builder, specToName } from "./builder.ts";
import { App } from "../app.ts";
import { BUILD_ID } from "../runtime/build_id.ts";
import { withTmpDir } from "../test_utils.ts";

Deno.test({
  name: "Builder - chain onTransformStaticFile",
  fn: async () => {
    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;

    const logs: string[] = [];
    const builder = new Builder({
      outDir: path.join(tmp, "dist"),
      staticDir: tmp,
    });
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

    await Deno.writeTextFile(path.join(tmp, "foo.css"), "body { color: red; }");
    await builder.build();

    expect(logs).toEqual(["A", "B", "C"]);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "Builder - handles Windows paths",
  fn: async () => {
    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;

    const builder = new Builder({
      outDir: path.join(tmp, "dist"),
      staticDir: tmp,
    });
    await Deno.mkdir(path.join(tmp, "images"));
    await Deno.writeTextFile(
      path.join(tmp, "images", "batman.svg"),
      "<svg></svg>",
    );
    await builder.build();

    const snapshotJson = await Deno.readTextFile(
      path.join(tmp, "dist", "static-files.json"),
    );
    expect(snapshotJson).toContain("/images/batman.svg");
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "Builder - hashes CSS urls by default",
  fn: async () => {
    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;
    const builder = new Builder({
      outDir: path.join(tmp, "dist"),
      staticDir: tmp,
    });

    await Deno.writeTextFile(
      path.join(tmp, "foo.css"),
      "body { background: url('/foo.jpg'); }",
    );
    await builder.build();

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
    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;
    const builder = new Builder({
      outDir: path.join(tmp, "dist"),
      staticDir: tmp,
    });
    await Deno.writeTextFile(
      path.join(tmp, "foo.css"),
      `:root { --icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgb(76, 154.5, 137.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E"); }`,
    );
    await builder.build();

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
    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;

    const outDir = path.join(tmp, "dist");
    const builder = new Builder({ outDir });

    const specifier = "jsr:@marvinh-test/fresh-island";
    builder.registerIsland(specifier);

    await builder.build();

    const name = specToName(specifier);
    const code = await Deno.readTextFile(
      path.join(
        tmp,
        "dist",
        "static",
        "_fresh",
        "js",
        BUILD_ID,
        `${name}.js`,
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
    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;

    const logs: string[] = [];
    const builder = new Builder({
      outDir: path.join(tmp, "dist"),
      staticDir: tmp,
    });

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

    await Deno.writeTextFile(path.join(tmp, "foo.css"), "body { color: red; }");
    await Deno.writeTextFile(
      path.join(tmp, "bar.css"),
      "body { color: blue; }",
    );
    await builder.build();

    expect(logs).toEqual(["A: bar.css", "B: bar.css", "C: bar.css"]);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "Builder - workspace folder middleware on listen",
  fn: async () => {
    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;

    const builder = new Builder({
      outDir: path.join(tmp, "dist"),
      staticDir: tmp,
    });
    const app = new App({
      staticDir: tmp,
    });
    const abort = new AbortController();
    const port = 8011;
    await builder.listen(() => Promise.resolve(app), {
      port,
      signal: abort.signal,
    });

    const res = await fetch(
      `http://localhost:${port}/.well-known/appspecific/com.chrome.devtools.json`,
    );
    const json = await res.json();
    await abort.abort();

    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
    expect(res.headers.get("etag")).toEqual(expect.any(String));
    expect(json).toEqual({
      workspace: {
        root: builder.config.root,
        uuid: expect.any(String),
      },
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test("specToName", () => {
  // HTTP
  expect(specToName("http://example.com")).toEqual("example");
  expect(specToName("http://example.com:8000")).toEqual("example");
  expect(specToName("http://example.com:8000/foo/bar")).toEqual(
    "bar",
  );

  // HTTPS
  expect(specToName("https://example.com")).toEqual("example");
  expect(specToName("https://example.com:8000")).toEqual("example");
  expect(specToName("https://example.com:8000/foo/bar")).toEqual(
    "bar",
  );

  // JSR
  expect(specToName("jsr:@foo/bar")).toEqual("foo_bar");
  expect(specToName("jsr:@foo/bar@1.0.0")).toEqual("foo_bar");
  expect(specToName("jsr:@foo/bar@^1.0.0")).toEqual("foo_bar");
  expect(specToName("jsr:@foo/bar@~1.0.0")).toEqual("foo_bar");
  expect(specToName("jsr:@foo/bar@~1.0.0-alpha.32")).toEqual("foo_bar");
  expect(specToName("jsr:@foo/bar@~1.0.0-alpha.32/asdf")).toEqual("asdf");
  expect(specToName("jsr:@foo/bar/asdf")).toEqual("asdf");

  // npm
  expect(specToName("npm:foo")).toEqual("foo");
  expect(specToName("npm:foo/bar")).toEqual("bar");
  expect(specToName("npm:foo@1.0.0")).toEqual("foo");
  expect(specToName("npm:foo@^1.0.0")).toEqual("foo");
  expect(specToName("npm:foo@~1.0.0-alpha.32")).toEqual("foo");
  expect(specToName("npm:@foo/bar")).toEqual("foo_bar");
  expect(specToName("npm:@foo/bar/asdf")).toEqual("asdf");
  expect(specToName("npm:@foo/bar@1.0.0")).toEqual("foo_bar");
  expect(specToName("npm:@foo/bar@^1.0.0")).toEqual("foo_bar");
  expect(specToName("npm:@foo/bar@~1.0.0-alpha.32")).toEqual("foo_bar");

  // other
  expect(specToName("foo")).toEqual("foo");
  expect(specToName("@foo/bar")).toEqual("foo_bar");
  expect(specToName("foo/bar")).toEqual("bar");
  expect(specToName("@foo/bar/asdf")).toEqual("asdf");

  expect(specToName("islands/foo.v2.tsx")).toEqual("foo_v2");
  expect(specToName("/islands/_bar-baz-...-$.tsx")).toEqual("_bar_baz_$");
  expect(specToName("/islands/1_hello.tsx")).toEqual("_hello");
});
