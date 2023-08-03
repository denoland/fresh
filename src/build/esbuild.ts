import { join } from "$fresh/src/server/deps.ts";
import {
  denoPlugins,
  esbuild,
  esbuildTypes,
  esbuildWasmURL,
  fromFileUrl,
  regexpEscape,
} from "./deps.ts";

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
  jsxConfig: JSXConfig;
  /** Output directory */
  outDir?: string;
}

export interface JSXConfig {
  jsx: "react" | "react-jsx";
  jsxImportSource?: string;
}

export const OUT_DIR = join(Deno.cwd(), "dist");

export interface BuildResult {
  dependencies: Map<string, string[]>;
}

export async function build(
  opts: EsbuildBuilderOptions,
): Promise<BuildResult> {
  const start = performance.now();
  try {
    await initEsbuild();

    // console.log("BUILD", opts);

    // In dev-mode we skip identifier minification to be able to show proper
    // component names in Preact DevTools instead of single characters.
    const minifyOptions: Partial<esbuildTypes.BuildOptions> = opts.dev
      ? {
        minifyIdentifiers: false,
        minifySyntax: true,
        minifyWhitespace: true,
      }
      : { minify: true };

    const bundle = await esbuild.build({
      entryPoints: opts.entrypoints,

      platform: "browser",
      target: ["chrome99", "firefox99", "safari15"],

      format: "esm",
      bundle: true,
      splitting: true,
      treeShaking: true,
      sourcemap: opts.dev ? "linked" : false,
      ...minifyOptions,

      jsx: JSX_RUNTIME_MODE[opts.jsxConfig.jsx],
      jsxImportSource: opts.jsxConfig.jsxImportSource,

      absWorkingDir: Deno.cwd(),
      outdir: opts.outDir ?? ".",
      write: true,
      metafile: true,
      publicPath: ".",

      plugins: [
        buildIdPlugin(opts.buildID),
        ...denoPlugins({ configPath: opts.configPath }),
      ],
    });

    const dependencies = new Map<string, string[]>();

    // console.log(bundle.metafile);
    const metaOutputs = new Map(Object.entries(bundle.metafile.outputs));

    for (const [path, entry] of metaOutputs.entries()) {
      const imports = entry.imports
        .filter(({ kind }) => kind === "import-statement")
        .map(({ path }) => path);
      dependencies.set(path, imports);
    }

    return { dependencies };
  } finally {
    stopEsbuild();
    const duration = performance.now() - start;
    console.log(`Building assets (${duration.toFixed(2)}ms)`);
  }
}

const JSX_RUNTIME_MODE = {
  "react": "transform",
  "react-jsx": "automatic",
} as const;

async function initEsbuild() {
  // deno-lint-ignore no-deprecated-deno-api
  if (Deno.run === undefined) {
    await esbuild.initialize({
      wasmURL: esbuildWasmURL,
      worker: false,
    });
  } else {
    await esbuild.initialize({});
  }
}

function stopEsbuild() {
  esbuild.stop();
}

function buildIdPlugin(buildId: string): esbuildTypes.Plugin {
  const file = import.meta.resolve("../runtime/build_id.ts");
  const url = new URL(file);
  let options: esbuildTypes.OnLoadOptions;
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
