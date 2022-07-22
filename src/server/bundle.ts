import { BUILD_ID } from "./constants.ts";
import { denoPlugin, esbuild, toFileUrl } from "./deps.ts";
import { Island, Plugin } from "./types.ts";

let esbuildInitialized: boolean | Promise<void> = false;
async function ensureEsbuildInitialized() {
  if (esbuildInitialized === false) {
    if (Deno.run === undefined) {
      esbuildInitialized = esbuild.initialize({
        wasmURL: "https://unpkg.com/esbuild-wasm@0.14.39/esbuild.wasm",
        worker: false,
      });
    } else {
      esbuild.initialize({});
    }
    await esbuildInitialized;
    esbuildInitialized = true;
  } else if (esbuildInitialized instanceof Promise) {
    await esbuildInitialized;
  }
}

export class Bundler {
  #importMapURL: URL;
  #islands: Island[];
  #plugins: Plugin[];
  #cache: Map<string, Uint8Array> | Promise<void> | undefined = undefined;

  constructor(islands: Island[], plugins: Plugin[], importMapURL: URL) {
    this.#islands = islands;
    this.#plugins = plugins;
    this.#importMapURL = importMapURL;
  }

  async bundle() {
    const entryPoints: Record<string, string> = {
      "main": new URL("../../src/runtime/main.ts", import.meta.url).href,
    };

    for (const island of this.#islands) {
      entryPoints[`island-${island.id}`] = island.url;
    }

    for (const plugin of this.#plugins) {
      for (const [name, url] of Object.entries(plugin.entrypoints ?? {})) {
        entryPoints[`plugin-${plugin.name}-${name}`] = url;
      }
    }

    const absWorkingDir = Deno.cwd();
    await ensureEsbuildInitialized();
    const bundle = await esbuild.build({
      bundle: true,
      define: { __FRSH_BUILD_ID: `"${BUILD_ID}"` },
      entryPoints,
      format: "esm",
      metafile: true,
      minify: true,
      outdir: ".",
      // This is requried to ensure the format of the outputFiles path is the same
      // between windows and linux
      absWorkingDir,
      outfile: "",
      platform: "neutral",
      plugins: [denoPlugin({ importMapURL: this.#importMapURL })],
      splitting: true,
      target: ["chrome99", "firefox99", "safari15"],
      treeShaking: true,
      write: false,
    });
    // const metafileOutputs = bundle.metafile!.outputs;

    // for (const path in metafileOutputs) {
    //   const meta = metafileOutputs[path];
    //   const imports = meta.imports
    //     .filter(({ kind }) => kind === "import-statement")
    //     .map(({ path }) => `/${path}`);
    //   this.#preloads.set(`/${path}`, imports);
    // }

    const cache = new Map<string, Uint8Array>();
    const absDirUrlLength = toFileUrl(absWorkingDir).href.length;
    for (const file of bundle.outputFiles) {
      cache.set(
        toFileUrl(file.path).href.substring(absDirUrlLength),
        file.contents,
      );
    }
    this.#cache = cache;

    return;
  }

  async cache(): Promise<Map<string, Uint8Array>> {
    if (this.#cache === undefined) {
      this.#cache = this.bundle();
    }
    if (this.#cache instanceof Promise) {
      await this.#cache;
    }
    return this.#cache as Map<string, Uint8Array>;
  }

  async get(path: string): Promise<Uint8Array | null> {
    const cache = await this.cache();
    return cache.get(path) ?? null;
  }

  // getPreloads(path: string): string[] {
  //   return this.#preloads.get(path) ?? [];
  // }
}
