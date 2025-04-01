import { denoPlugins } from "@luca/esbuild-deno-loader";
import type { Plugin as EsbuildPlugin } from "esbuild";
import * as path from "@std/path";

export interface FreshBundleOptions {
  dev: boolean;
  cwd: string;
  buildId: string;
  outDir: string;
  denoJsonPath: string;
  entryPoints: Record<string, string>;
  target: string | string[];
  jsxImportSource?: string;
}

export interface BuildOutput {
  entryToChunk: Map<string, string>;
  dependencies: Map<string, string[]>;
  files: Array<{ hash: string | null; contents: Uint8Array; path: string }>;
}

let esbuild: null | typeof import("esbuild") = null;

const PREACT_ENV = Deno.env.get("PREACT_PATH");

export async function bundleJs(
  options: FreshBundleOptions,
): Promise<BuildOutput> {
  if (esbuild === null) {
    await startEsbuild();
  }

  try {
    await Deno.mkdir(options.cwd, { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) {
      throw err;
    }
  }

  const bundle = await esbuild!.build({
    entryPoints: options.entryPoints,

    platform: "browser",
    target: options.target,

    format: "esm",
    bundle: true,
    splitting: true,
    treeShaking: true,
    sourcemap: options.dev ? "linked" : false,
    minify: !options.dev,

    jsxDev: options.dev,
    jsx: "automatic",
    jsxImportSource: options.jsxImportSource ?? "preact",

    absWorkingDir: options.cwd,
    outdir: ".",
    write: false,
    metafile: true,

    define: {
      "process.env.NODE_ENV": JSON.stringify(
        options.dev ? "development" : "production",
      ),
    },

    plugins: [
      preactDebugger(PREACT_ENV),
      buildIdPlugin(options.buildId),
      windowsPathFixer(),
      ...denoPlugins({ configPath: options.denoJsonPath }),
    ],
  });

  const files: BuildOutput["files"] = [];
  for (let i = 0; i < bundle.outputFiles.length; i++) {
    const outputFile = bundle.outputFiles[i];
    const relative = path.relative(options.cwd, outputFile.path);
    files.push({
      path: relative,
      contents: outputFile.contents,
      hash: outputFile.hash,
    });
  }

  files.push({
    path: "metafile.json",
    contents: new TextEncoder().encode(JSON.stringify(bundle.metafile)),
    hash: null,
  });

  const entryToChunk = new Map<string, string>();
  const dependencies = new Map<string, string[]>();

  const entryToName = new Map(
    Array.from(Object.entries(options.entryPoints)).map(
      (entry) => [entry[1], entry[0]],
    ),
  );

  if (bundle.metafile) {
    const metaOutputs = new Map(Object.entries(bundle.metafile.outputs));

    for (const [entryPath, entry] of metaOutputs.entries()) {
      const imports = entry.imports
        .filter(({ kind }) => kind === "import-statement")
        .map(({ path }) => path);
      dependencies.set(entryPath, imports);

      if (entryPath !== "fresh-runtime.js" && entry.entryPoint !== undefined) {
        let filePath = "";
        // Resolve back specifiers to original url. This is necessary
        // to get JSR dependencies to match what we specified as
        // an entry point to esbuild.
        if (
          entry.entryPoint.startsWith("https://") ||
          entry.entryPoint.startsWith("http://")
        ) {
          const basename = path.basename(entryPath, path.extname(entryPath));
          filePath = options.entryPoints[basename];
        } else {
          filePath = path.join(options.cwd, entry.entryPoint);
        }

        const name = entryToName.get(filePath)!;
        entryToChunk.set(name, entryPath);
      }
    }
  }

  if (!options.dev) {
    esbuild = null;
  }

  return {
    files,
    entryToChunk,
    dependencies,
  };
}

let initialized = false;

export async function startEsbuild() {
  esbuild = Deno.env.get("FRESH_ESBUILD_LOADER") === "portable"
    ? await import("esbuild-wasm")
    : await import("esbuild");

  if (!initialized) {
    await esbuild.initialize({});
    initialized = true;
  }
}

function buildIdPlugin(buildId: string): EsbuildPlugin {
  return {
    name: "fresh-build-id",
    setup(build) {
      build.onResolve({ filter: /runtime[/\\]+build_id\.ts$/ }, (args) => {
        return {
          path: args.path,
          namespace: "fresh-internal",
        };
      });
      build.onLoad({
        filter: /runtime[/\\]build_id\.ts$/,
        namespace: "fresh-internal",
      }, () => {
        return {
          contents: `export const BUILD_ID = "${buildId}";`,
        };
      });
    },
  };
}

function toPreactModPath(mod: string): string {
  if (mod === "preact/debug") {
    return path.join("debug", "dist", "debug.module.js");
  } else if (mod === "preact/hooks") {
    return path.join("hooks", "dist", "hooks.module.js");
  } else if (mod === "preact/devtools") {
    return path.join("devtools", "dist", "devtools.module.js");
  } else if (mod === "preact/compat") {
    return path.join("compat", "dist", "compat.module.js");
  } else if (mod === "preact/jsx-runtime" || mod === "preact/jsx-dev-runtime") {
    return path.join("jsx-runtime", "dist", "jsxRuntime.module.js");
  } else {
    return path.join("dist", "preact.module.js");
  }
}

function preactDebugger(preactPath: string | undefined): EsbuildPlugin {
  return {
    name: "fresh-preact-debugger",
    setup(build) {
      if (preactPath === undefined) return;

      build.onResolve({ filter: /^preact/ }, (args) => {
        const resolved = path.resolve(preactPath, toPreactModPath(args.path));

        return {
          path: resolved,
        };
      });
    },
  };
}

function windowsPathFixer(): EsbuildPlugin {
  return {
    name: "fresh-fix-windows",
    setup(build) {
      if (Deno.build.os === "windows") {
        build.onResolve({ filter: /\.*/ }, (args) => {
          if (args.path.startsWith("\\")) {
            const normalized = path.resolve(args.path);
            return {
              path: normalized,
            };
          }
        });
      }
    },
  };
}
