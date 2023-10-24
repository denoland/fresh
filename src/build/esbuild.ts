import {
  type BuildOptions,
  type OnLoadOptions,
  type Plugin,
} from "https://deno.land/x/esbuild@v0.19.4/mod.js";
import { denoPlugins, fromFileUrl, regexpEscape, relative } from "./deps.ts";
import { Builder, BuildSnapshot } from "./mod.ts";

export interface EsbuildBuilderOptions {
  /** The build ID. */
  buildID: string;
  /** The entrypoints, mapped from name to URL. */
  entrypoints: Record<string, string>;
  /** Whether or not this is a dev build. */
  dev: boolean;
  /** The path to the deno.json / deno.jsonc config file. */
  configPath: string;
  /** The JSX configuration. */
  jsx?: string;
  jsxImportSource?: string;
  target: string | string[];
  absoluteWorkingDir: string;
}

export class EsbuildBuilder implements Builder {
  #options: EsbuildBuilderOptions;

  constructor(options: EsbuildBuilderOptions) {
    this.#options = options;
  }

  async build(): Promise<EsbuildSnapshot> {
    const opts = this.#options;

    // Lazily initialize esbuild
    // @deno-types="https://deno.land/x/esbuild@v0.19.4/mod.d.ts"
    const esbuild =
      // deno-lint-ignore no-deprecated-deno-api
      Deno.run === undefined ||
        Deno.env.get("FRESH_ESBUILD_LOADER") === "portable"
        ? await import("https://deno.land/x/esbuild@v0.19.4/wasm.js")
        : await import("https://deno.land/x/esbuild@v0.19.4/mod.js");
    const esbuildWasmURL =
      new URL("./esbuild_v0.19.4.wasm", import.meta.url).href;

    // deno-lint-ignore no-deprecated-deno-api
    if (Deno.run === undefined) {
      await esbuild.initialize({
        wasmURL: esbuildWasmURL,
        worker: false,
      });
    } else {
      await esbuild.initialize({});
    }

    try {
      const absWorkingDir = opts.absoluteWorkingDir;

      // In dev-mode we skip identifier minification to be able to show proper
      // component names in Preact DevTools instead of single characters.
      const minifyOptions: Partial<BuildOptions> = opts.dev
        ? {
          minifyIdentifiers: false,
          minifySyntax: true,
          minifyWhitespace: true,
        }
        : { minify: true };

      const bundle = await esbuild.build({
        entryPoints: opts.entrypoints,

        platform: "browser",
        target: this.#options.target,

        format: "esm",
        bundle: true,
        splitting: true,
        treeShaking: true,
        sourcemap: opts.dev ? "linked" : false,
        ...minifyOptions,

        jsx: opts.jsx === "react"
          ? "transform"
          : opts.jsx === "react-native" || opts.jsx === "preserve"
          ? "preserve"
          : !opts.jsxImportSource
          ? "transform"
          : "automatic",
        jsxImportSource: opts.jsxImportSource ?? "preact",

        absWorkingDir,
        outdir: ".",
        write: false,
        metafile: true,

        plugins: [
          buildIdPlugin(opts.buildID),
          ...denoPlugins({ configPath: opts.configPath }),
        ],
      });

      const files = new Map<string, Uint8Array>();
      const dependencies = new Map<string, string[]>();

      for (const file of bundle.outputFiles) {
        const path = relative(absWorkingDir, file.path);
        files.set(path, file.contents);
      }

      files.set(
        "metafile.json",
        new TextEncoder().encode(JSON.stringify(bundle.metafile)),
      );

      const metaOutputs = new Map(Object.entries(bundle.metafile.outputs));

      for (const [path, entry] of metaOutputs.entries()) {
        const imports = entry.imports
          .filter(({ kind }) => kind === "import-statement")
          .map(({ path }) => path);
        dependencies.set(path, imports);
      }

      return new EsbuildSnapshot(files, dependencies);
    } finally {
      esbuild.stop();
    }
  }
}

function buildIdPlugin(buildId: string): Plugin {
  const file = import.meta.resolve("../runtime/build_id.ts");
  const url = new URL(file);
  let options: OnLoadOptions;
  if (url.protocol === "file:") {
    const path = fromFileUrl(url);
    const filter = new RegExp(`^${regexpEscape(path)}$`);
    options = { filter, namespace: "file" };
  } else {
    const namespace = url.protocol.slice(0, -1);
    const path = url.href.slice(namespace.length + 1);
    const filter = new RegExp(`^${regexpEscape(path)}$`);
    options = { filter, namespace };
  }
  return {
    name: "fresh-build-id",
    setup(build) {
      build.onLoad(
        options,
        () => ({ contents: `export const BUILD_ID = "${buildId}";` }),
      );
    },
  };
}

export class EsbuildSnapshot implements BuildSnapshot {
  #files: Map<string, Uint8Array>;
  #dependencies: Map<string, string[]>;

  constructor(
    files: Map<string, Uint8Array>,
    dependencies: Map<string, string[]>,
  ) {
    this.#files = files;
    this.#dependencies = dependencies;
  }

  get paths(): string[] {
    return Array.from(this.#files.keys());
  }

  read(path: string): Uint8Array | null {
    return this.#files.get(path) ?? null;
  }

  dependencies(path: string): string[] {
    return this.#dependencies.get(path) ?? [];
  }
}
