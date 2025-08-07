import { expect, fn } from "@std/expect";
import * as path from "@std/path";
import { Builder, specToName } from "./builder.ts";
import { App } from "../app.ts";
import { DEV_ERROR_OVERLAY_URL } from "../constants.ts";
import { BUILD_ID } from "@fresh/build-id";
import { withTmpDir, writeFiles } from "../test_utils.ts";
import {
  getStdOutput,
  withChildProcessServer,
} from "../../tests/test_utils.tsx";
import { staticFiles } from "../middlewares/static_files.ts";

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
      path.join(tmp, "dist", "snapshot.js"),
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
  name: "Builder - can bundle islands with import.meta.resolve()",
  fn: async () => {
    await using _tmp = await withTmpDir();
    const tmp = _tmp.dir;

    const outDir = path.join(tmp, "dist");
    const builder = new Builder({ outDir });

    const specifier = import.meta.resolve(
      "../../tests/fixtures_islands/Counter.tsx",
    );
    builder.registerIsland(specifier);

    await builder.build({ mode: "production", snapshot: "disk" });

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
    expect(code).toContain('"decrement"');
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
    const app = new App();
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

Deno.test({
  name: "Builder - write prod routePattern",
  fn: async () => {
    const root = path.join(import.meta.dirname!, "..", "..");
    await using _tmp = await withTmpDir({ dir: root, prefix: "tmp_builder_" });
    const tmp = _tmp.dir;

    await writeFiles(tmp, {
      "routes/foo/index.ts": `export const handler = () => new Response("ok")`,
      "main.ts": `import { App } from "fresh";
export const app = new App().fsRoutes()`,
    });

    const builder = new Builder({
      root: tmp,
      outDir: path.join(tmp, "dist"),
    });

    await builder.build();

    let text = "fail";
    await withChildProcessServer(
      { cwd: tmp, args: ["serve", "-A", "dist/server.js"] },
      async (address) => {
        const res = await fetch(`${address}/foo`);
        text = await res.text();
      },
    );

    expect(text).toEqual("ok");
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "Builder - file:// islands",
  fn: async () => {
    const root = path.join(import.meta.dirname!, "..", "..");
    await using _tmp = await withTmpDir({ dir: root, prefix: "tmp_builder_" });
    const tmp = _tmp.dir;

    await writeFiles(tmp, {
      "other/Foo.tsx": `export default () => <h1>ok</h1>;`,
      "routes/index.tsx": `import Foo from "../other/Foo.tsx";
      export default () => <Foo />;`,
      "main.ts": `import { App } from "fresh";
export const app = new App().fsRoutes()`,
    });

    const builder = new Builder({
      root: tmp,
      outDir: path.join(tmp, "dist"),
    });

    const islandPath = path.join(tmp, "other", "Foo.tsx");
    builder.registerIsland(path.toFileUrl(islandPath).href);

    await builder.build();

    let text = "fail";
    await withChildProcessServer(
      { cwd: tmp, args: ["serve", "-A", "dist/server.js"] },
      async (address) => {
        const res = await fetch(address);
        text = await res.text();
      },
    );

    expect(text).toContain("<h1>ok</h1>");
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "Builder - dev server doesn't overtake _error handler",
  fn: async () => {
    const root = path.join(import.meta.dirname!, "..", "..");
    await using _tmp = await withTmpDir({ dir: root, prefix: "tmp_builder_" });
    const tmp = _tmp.dir;

    const app = new App()
      .onError("*", () => new Response("it works"))
      .get("/", () => new Response("no"));

    const builder = new Builder({
      root: tmp,
      outDir: path.join(tmp, "dist"),
    });

    const controller = new AbortController();
    await builder.listen(() => Promise.resolve<App<unknown>>(app), {
      signal: controller.signal,
      async onListen(addr) {
        const res = await fetch(`http://localhost:${addr.port}/invalid`);

        const text = await res.text();
        expect(text).toEqual("it works");

        controller.abort();
      },
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "Builder - dev server supports basePath",
  fn: async () => {
    const root = path.join(import.meta.dirname!, "..", "..");
    await using _tmp = await withTmpDir({ dir: root, prefix: "tmp_builder_" });
    const tmp = _tmp.dir;

    const app = new App({ basePath: "/foo/bar" })
      .get("/", () => new Response("ok"))
      .get("/asdf", () => new Response("ok"));

    const builder = new Builder({
      root: tmp,
      outDir: path.join(tmp, "dist"),
    });

    const controller = new AbortController();
    let address;
    await builder.listen(() => Promise.resolve<App<unknown>>(app), {
      signal: controller.signal,
      onListen(addr) {
        address = `http://localhost:${addr.port}`;
      },
    });

    const res = await fetch(`${address}/foo/bar/asdf`);

    const text = await res.text();
    expect(text).toEqual("ok");

    controller.abort();
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "Builder - serves static files in subdir",
  fn: async () => {
    const root = path.join(import.meta.dirname!, "..", "..");
    await using _tmp = await withTmpDir({ dir: root, prefix: "tmp_builder_" });
    const tmp = _tmp.dir;

    const app = new App()
      .use(staticFiles())
      .get("/", () => new Response("no"));

    await writeFiles(tmp, {
      "static/foo.txt": "ok",
      "static/test/foo.txt": "ok",
    });

    const builder = new Builder({
      root: tmp,
    });

    const controller = new AbortController();
    const waiter = Promise.withResolvers<void>();
    await builder.listen(() => Promise.resolve<App<unknown>>(app), {
      signal: controller.signal,
      async onListen(addr) {
        try {
          let res = await fetch(`http://localhost:${addr.port}/foo.txt`);
          expect(await res.text()).toEqual("ok");

          res = await fetch(`http://localhost:${addr.port}/test/foo.txt`);
          expect(await res.text()).toEqual("ok");

          controller.abort();
          waiter.resolve();
        } catch (err) {
          waiter.reject(err);
        }
      },
    });

    await waiter.promise;
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "Builder - serves static files in subdir in prod",
  fn: async () => {
    const root = path.join(import.meta.dirname!, "..", "..");
    await using _tmp = await withTmpDir({ dir: root, prefix: "tmp_builder_" });
    const tmp = _tmp.dir;

    await writeFiles(tmp, {
      "main.ts": `import { App, staticFiles } from "fresh";
export const app = new App()
  .use(staticFiles());`,
      "static/foo.txt": "ok",
      "static/test/foo.txt": "ok",
    });

    await new Builder({ root: tmp }).build();

    await withChildProcessServer(
      { cwd: tmp, args: ["serve", "-A", "_fresh/server.js"] },
      async (address) => {
        let res = await fetch(`${address}/foo.txt`);
        expect(await res.text()).toEqual("ok");

        res = await fetch(`${address}/test/foo.txt`);
        expect(await res.text()).toEqual("ok");
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "Builder - dev server error_overlay ignores _app and _layout",
  fn: async () => {
    const root = path.join(import.meta.dirname!, "..", "..");
    await using _tmp = await withTmpDir({ dir: root, prefix: "tmp_builder_" });
    const tmp = _tmp.dir;
    const appLayoutSpy = fn(() => "app or layout") as () => string;

    const app = new App()
      .appWrapper(appLayoutSpy)
      .layout("/", appLayoutSpy);

    const builder = new Builder({
      root: tmp,
      outDir: path.join(tmp, "dist"),
    });

    const controller = new AbortController();
    await builder.listen(() => Promise.resolve<App<unknown>>(app), {
      signal: controller.signal,
      async onListen(addr) {
        const res = await fetch(
          `http://localhost:${addr.port}/${DEV_ERROR_OVERLAY_URL}?message=__ok__`,
        );

        const text = await res.text();
        expect(text).toMatch(/__ok__/);
        expect(appLayoutSpy).toHaveBeenCalledTimes(0);

        controller.abort();
      },
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  // Currently waiting on bug fixes in @deno/loader
  // to support resolving without passing entry points
  ignore: true,
  name: "Builder - mapped islands",
  fn: async () => {
    const root = path.join(import.meta.dirname!, "..", "..");
    await using _tmp = await withTmpDir({ dir: root, prefix: "tmp_builder_" });
    const tmp = _tmp.dir;

    await writeFiles(tmp, {
      "other/Foo.tsx": `export default () => <h1>ok</h1>;`,
      "routes/index.tsx": `import Foo from "foo-island";
      export default () => <Foo />;`,
      "main.ts": `import { App } from "fresh";
export const app = new App().fsRoutes()`,
      "deno.json": JSON.stringify({
        imports: { "foo-island": "other/Foo.tsx" },
      }),
    });

    const builder = new Builder({
      root: tmp,
      outDir: path.join(tmp, "dist"),
    });

    builder.registerIsland("foo-island");

    await builder.build();

    let text = "fail";
    await withChildProcessServer(
      { cwd: tmp, args: ["serve", "-A", "dist/server.js"] },
      async (address) => {
        const res = await fetch(address);
        text = await res.text();
      },
    );

    expect(text).toContain("<h1>ok</h1>");
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "Builder - source maps",
  fn: async () => {
    const root = path.join(import.meta.dirname!, "..", "..");
    await using _tmp = await withTmpDir({ dir: root, prefix: "tmp_builder_" });
    const tmp = _tmp.dir;

    await writeFiles(tmp, {
      "islands/Foo.tsx": `export const Foo = () => <h1>hello</h1>`,
      "routes/index.ts": `export const handler = () => new Response("ok")`,
      "main.ts": `import { App } from "fresh";
export const app = new App().fsRoutes()`,
    });

    const builder = new Builder({
      root: tmp,
      outDir: path.join(tmp, "dist"),
      sourceMap: {
        kind: "external",
        sourceRoot: "foo",
        sourcesContent: true,
      },
    });
    await builder.build();

    const assetDir = path.join(
      builder.config.outDir,
      "static",
      "_fresh",
      "js",
      builder.config.buildId,
    );
    const entries = await Array.fromAsync(Deno.readDir(assetDir));

    const map = entries.find((entry) =>
      entry.isFile && entry.name.endsWith(".js.map")
    );
    if (!map) throw new Error(`Sourcemap not found`);

    const content = await Deno.readTextFile(path.join(assetDir, map.name));

    const json = JSON.parse(content) as {
      version: 3;
      sources: string[];
      sourceRoot?: string;
      sourcesContent: string[];
      mappings: string;
      names?: string[];
    };

    expect(json.sourcesContent.length).toBeGreaterThan(0);
    expect(json.sourcesContent.length).toBeGreaterThan(0);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "Builder - compile entry",
  fn: async () => {
    const root = path.join(import.meta.dirname!, "..", "..");
    await using _tmp = await withTmpDir({ dir: root, prefix: "tmp_builder_" });
    await using _outDir = await withTmpDir();
    const tmp = _tmp.dir;

    await writeFiles(tmp, {
      "deno.json": JSON.stringify({
        links: [path.relative(tmp, root)],
        workspace: [],
        compilerOptions: {
          jsx: "react-jsx",
          jsxImportSource: "preact",
        },
        imports: {
          "fresh": "jsr:@fresh/core@*",
          "preact": "npm:preact@*",
          "@preact/signals": "npm:@preact/signals@*",
        },
      }),
      "islands/Foo.tsx": `export const Foo = () => <h1>hello</h1>`,
      "routes/index.ts": `export const handler = () => new Response("ok")`,
      "static/foo.txt": "ok",
      "main.ts": `import { App, staticFiles } from "fresh";
export const app = new App()
  .use(staticFiles())
  .fsRoutes();`,
    });

    const builder = new Builder({
      root: tmp,
    });
    await builder.build();

    const outBin = path.join(_outDir.dir, "fresh-compiled");
    const bin = Deno.build.os === "windows" ? "deno.exe" : "deno";
    const cp = await new Deno.Command(bin, {
      args: [
        "compile",
        "-A",
        "--include",
        "static/",
        "--include",
        "_fresh",
        "--output",
        outBin,
        path.join("_fresh", "compiled-entry.js"),
      ],
      cwd: tmp,
    }).output();

    const { stderr, stdout } = getStdOutput(cp);
    // deno-lint-ignore no-console
    console.log(stdout);
    // deno-lint-ignore no-console
    console.log(stderr);

    await withChildProcessServer({
      bin: outBin,
      cwd: _outDir.dir,
      args: [],
      env: {
        PORT: "0",
        HOSTNAME: "127.0.0.1",
      },
    }, async (address) => {
      let res = await fetch(address);
      expect(await res.text()).toEqual("ok");

      res = await fetch(`${address}/foo.txt`);
      expect(await res.text()).toEqual("ok");
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "Builder - island that imports json entry",
  fn: async () => {
    const root = path.join(import.meta.dirname!, "..", "..");
    await using _tmp = await withTmpDir({ dir: root, prefix: "tmp_builder_" });
    await using _outDir = await withTmpDir();
    const tmp = _tmp.dir;

    await writeFiles(tmp, {
      "deno.json": JSON.stringify({
        links: [path.relative(tmp, root)],
        workspace: [],
        compilerOptions: {
          jsx: "react-jsx",
          jsxImportSource: "preact",
        },
        imports: {
          "fresh": "jsr:@fresh/core@*",
          "preact": "npm:preact@*",
          "@preact/signals": "npm:@preact/signals@*",
          "mime-db": "npm:mime-db@*",
        },
      }),
      "islands/Foo.tsx": `import * as mime from "mime-db"
export const Foo = () => {
  console.log(mime);
  return <h1>ok</h1>
}`,
      "routes/index.ts": `export default () => <Foo />`,
      "main.ts": `import { App, staticFiles } from "fresh";
export const app = new App()
  .use(staticFiles())
  .fsRoutes();`,
    });

    const builder = new Builder({
      root: tmp,
    });
    await builder.build();
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
