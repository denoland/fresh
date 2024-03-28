import type { BuildOptions } from "esbuild-wasm";
import { denoPlugins } from "@luca/esbuild-deno-loader";
import * as path from "@std/path";

export interface FreshBundleOptions {
  dev: boolean;
  cwd: string;
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

let esbuild: null | typeof import("esbuild-wasm") = null;

export async function bundleJs(
  options: FreshBundleOptions,
): Promise<BuildOutput> {
  if (esbuild === null) {
    esbuild = Deno.env.get("FRESH_ESBUILD_LOADER") === "portable"
      ? await import("esbuild-wasm")
      : await import("esbuild");

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
    outdir: ".",
    write: false,
    metafile: true,

    plugins: [
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
        const filePath = path.join(options.cwd, entry.entryPoint);

        const name = entryToName.get(filePath)!;
        entryToChunk.set(name, entryPath);
      }
    }
  }

  return {
    files,
    entryToChunk,
    dependencies,
  };
}
