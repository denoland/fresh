import {
  type BuildOptions,
  type Plugin as EsbuildPlugin,
} from "npm:esbuild-wasm";
import { denoPlugins } from "@luca/esbuild-deno-loader";
import * as path from "@std/path";

export interface FreshBundleOptions {
  dev: boolean;
  cwd: string;
  outDir: string;
  denoJsonPath: string;
  entryPoints: string[];
  target: string | string[];
  jsxImportSource?: string;
}

export interface BuildOutput {
  files: Array<{ hash: string; contents: Uint8Array; path: string }>;
}

let esbuild: null | typeof import("npm:esbuild-wasm") = null;

export async function bundleJs(
  options: FreshBundleOptions,
): Promise<BuildOutput> {
  if (esbuild === null) {
    esbuild = Deno.env.get("FRESH_ESBUILD_LOADER") === "portable"
      ? await import("npm:esbuild-wasm")
      : await import("npm:esbuild");

    await esbuild.initialize({});
  }

  try {
    await Deno.mkdir(options.cwd, { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) {
      throw err;
    }
  }

  // In dev-mode we skip identifier minification to be able to show proper
  // component names in Preact DevTools instead of single characters.
  const minifyOptions: Partial<BuildOptions> = options.dev
    ? {
      minifyIdentifiers: false,
      minifySyntax: true,
      minifyWhitespace: true,
    }
    : { minify: true };

  const bundle = await esbuild.build({
    entryPoints: options.entryPoints,

    platform: "browser",
    target: options.target,

    format: "esm",
    bundle: true,
    splitting: true,
    treeShaking: true,
    sourcemap: options.dev ? "linked" : false,
    ...minifyOptions,

    jsxDev: options.dev,
    jsx: "automatic",
    jsxImportSource: options.jsxImportSource ?? "preact",

    absWorkingDir: options.cwd,
    outdir: options.outDir,
    write: false,
    metafile: true,

    plugins: [
      freshRuntime(),
      ...denoPlugins({ configPath: options.denoJsonPath }),
    ],
  });

  const files: BuildOutput["files"] = [];
  for (let i = 0; i < bundle.outputFiles.length; i++) {
    const outputFile = bundle.outputFiles[i];
    files.push(outputFile);
  }

  return {
    files,
  };
}

function freshRuntime(): EsbuildPlugin {
  return {
    name: "fresh-runtime",
    setup(build) {
      build.onResolve({ filter: /^fresh-runtime$/ }, (args) => {
        const filePath = path.join(
          import.meta.dirname!,
          "..",
          "runtime",
          "client.tsx",
        );
        return {
          path: filePath,
          // namespace: "fresh",
        };
      });
      build.onLoad(
        { filter: /^fresh-runtime$/, namespace: "fresh" },
        async () => {
          const filePath = path.join(
            import.meta.dirname!,
            "..",
            "runtime",
            "client.tsx",
          );
          const contents = await Deno.readFile(filePath);
          return {
            contents,
            resolveDir: path.dirname(filePath),
            loader: "tsx",
          };
        },
      );
    },
  };
}
