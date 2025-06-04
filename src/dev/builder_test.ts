import { expect } from "@std/expect";
import * as path from "@std/path";
import { Builder, readDenoConfigForCompilerOptions } from "./builder.ts";
import { App } from "../app.ts";
import { RemoteIsland } from "@marvinh-test/fresh-island";
import { BUILD_ID } from "../runtime/build_id.ts";
import { withTmpDir } from "../test_utils.ts";

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

    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;
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
    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;
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
    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;
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
    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;
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
    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;
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

    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;
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

Deno.test({
  name: "Builder - workspace folder middleware on listen",
  fn: async () => {
    const builder = new Builder();
    const tmp = await Deno.makeTempDir();
    const app = new App({
      staticDir: tmp,
      build: {
        outDir: path.join(tmp, "dist"),
      },
    });
    const abort = new AbortController();
    const port = 8011;
    await builder.listen(app, { port, signal: abort.signal });

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
        root: app.config.root,
        uuid: expect.any(String),
      },
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

// Add tests for the improved config inheritance logic
Deno.test({
  name: "readDenoConfigForCompilerOptions - workspace config inheritance",
  fn: async () => {
    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;

    // Create workspace root with JSX config
    const workspaceRoot = path.join(tmp, "workspace");
    await Deno.mkdir(workspaceRoot, { recursive: true });
    await Deno.writeTextFile(
      path.join(workspaceRoot, "deno.json"),
      JSON.stringify(
        {
          workspace: ["./apps/*"],
          compilerOptions: {
            jsx: "precompile",
            jsxImportSource: "preact",
            jsxPrecompileSkipElements: ["a", "img"],
          },
        },
        null,
        2,
      ),
    );

    // Create app with specific JSX config that should override workspace
    const appDir = path.join(workspaceRoot, "apps", "my-app");
    await Deno.mkdir(appDir, { recursive: true });
    await Deno.writeTextFile(
      path.join(appDir, "deno.json"),
      JSON.stringify(
        {
          compilerOptions: {
            jsxImportSource: "react", // Different from workspace
            jsxPrecompileSkipElements: [
              "a",
              "img",
              "source",
              "body",
              "html",
              "head",
            ], // Extended list
          },
        },
        null,
        2,
      ),
    );

    const result = await readDenoConfigForCompilerOptions(appDir);

    // Should merge configs with app-level taking precedence
    expect(result.config.compilerOptions?.jsx).toEqual("precompile"); // From workspace
    expect(result.config.compilerOptions?.jsxImportSource).toEqual("react"); // From app (overrides workspace)
    expect(result.config.compilerOptions?.jsxPrecompileSkipElements).toEqual([
      "a",
      "img",
      "source",
      "body",
      "html",
      "head",
    ]); // From app (overrides workspace)
    expect(result.filePath).toEqual(path.join(appDir, "deno.json")); // Should return app config path
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "readDenoConfigForCompilerOptions - empty workspace disconnection",
  fn: async () => {
    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;

    // Create workspace root
    const workspaceRoot = path.join(tmp, "workspace");
    await Deno.mkdir(workspaceRoot, { recursive: true });
    await Deno.writeTextFile(
      path.join(workspaceRoot, "deno.json"),
      JSON.stringify(
        {
          workspace: ["./apps/*"],
          compilerOptions: {
            jsx: "precompile",
            jsxImportSource: "preact",
          },
        },
        null,
        2,
      ),
    );

    // Create app that disconnects from workspace using empty workspace array
    const appDir = path.join(workspaceRoot, "apps", "disconnected-app");
    await Deno.mkdir(appDir, { recursive: true });
    await Deno.writeTextFile(
      path.join(appDir, "deno.json"),
      JSON.stringify(
        {
          workspace: [], // Empty array disconnects from workspace
          compilerOptions: {
            jsx: "react-jsx",
            jsxImportSource: "react",
          },
        },
        null,
        2,
      ),
    );

    const result = await readDenoConfigForCompilerOptions(appDir);

    // Should use only app config, not inherit from workspace
    expect(result.config.compilerOptions?.jsx).toEqual("react-jsx");
    expect(result.config.compilerOptions?.jsxImportSource).toEqual("react");
    expect(result.config.workspace).toEqual([]);
    expect(result.filePath).toEqual(path.join(appDir, "deno.json"));
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "readDenoConfigForCompilerOptions - app-only config",
  fn: async () => {
    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;

    // Create standalone app without workspace
    await Deno.writeTextFile(
      path.join(tmp, "deno.json"),
      JSON.stringify(
        {
          compilerOptions: {
            jsx: "precompile",
            jsxImportSource: "preact",
            jsxPrecompileSkipElements: [
              "a",
              "img",
              "source",
              "body",
              "html",
              "head",
            ],
          },
        },
        null,
        2,
      ),
    );

    const result = await readDenoConfigForCompilerOptions(tmp);

    // Should use app config as-is
    expect(result.config.compilerOptions?.jsx).toEqual("precompile");
    expect(result.config.compilerOptions?.jsxImportSource).toEqual("preact");
    expect(result.config.compilerOptions?.jsxPrecompileSkipElements).toEqual([
      "a",
      "img",
      "source",
      "body",
      "html",
      "head",
    ]);
    expect(result.filePath).toEqual(path.join(tmp, "deno.json"));
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "readDenoConfigForCompilerOptions - partial app config inheritance",
  fn: async () => {
    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;

    // Create workspace root with full JSX config
    const workspaceRoot = path.join(tmp, "workspace");
    await Deno.mkdir(workspaceRoot, { recursive: true });
    await Deno.writeTextFile(
      path.join(workspaceRoot, "deno.json"),
      JSON.stringify(
        {
          workspace: ["./packages/*"],
          compilerOptions: {
            jsx: "precompile",
            jsxImportSource: "preact",
            jsxPrecompileSkipElements: ["a", "img", "source"],
          },
        },
        null,
        2,
      ),
    );

    // Create app with partial JSX config
    const appDir = path.join(workspaceRoot, "packages", "partial-app");
    await Deno.mkdir(appDir, { recursive: true });
    await Deno.writeTextFile(
      path.join(appDir, "deno.json"),
      JSON.stringify(
        {
          compilerOptions: {
            // Only override specific properties
            jsxPrecompileSkipElements: [
              "a",
              "img",
              "source",
              "body",
              "html",
              "head",
            ],
          },
        },
        null,
        2,
      ),
    );

    const result = await readDenoConfigForCompilerOptions(appDir);

    // Should inherit jsx and jsxImportSource from workspace, but override jsxPrecompileSkipElements
    expect(result.config.compilerOptions?.jsx).toEqual("precompile"); // From workspace
    expect(result.config.compilerOptions?.jsxImportSource).toEqual("preact"); // From workspace
    expect(result.config.compilerOptions?.jsxPrecompileSkipElements).toEqual([
      "a",
      "img",
      "source",
      "body",
      "html",
      "head",
    ]); // From app (overrides workspace)
    expect(result.filePath).toEqual(path.join(appDir, "deno.json"));
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
