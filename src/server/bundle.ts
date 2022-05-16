import { BUILD_ID } from "./constants.ts";
import { denoPlugin, esbuild, toFileUrl } from "./deps.ts";
import { Island } from "./types.ts";

let esbuildInitalized: boolean | Promise<void> = false;
async function ensureEsbuildInialized() {
  if (esbuildInitalized === false) {
    if (Deno.run === undefined) {
      esbuildInitalized = esbuild.initialize({
        wasmURL: "https://unpkg.com/esbuild-wasm@0.14.34/esbuild.wasm",
        worker: false,
      });
    } else {
      esbuild.initialize({});
    }
    await esbuildInitalized;
    esbuildInitalized = true;
  } else if (esbuildInitalized instanceof Promise) {
    await esbuildInitalized;
  }
}

export class Bundler {
  #islands: Island[];
  #cache: Map<
    string | undefined,
    Map<string, Uint8Array> | Promise<Map<string, Uint8Array>>
  > = new Map();

  constructor(islands: Island[]) {
    this.#islands = islands;
  }

  async bundle(target: string | undefined): Promise<Map<string, Uint8Array>> {
    const entryPoints: Record<string, string> = {
      "main": new URL("../../src/runtime/main.ts", import.meta.url).href,
    };

    for (const island of this.#islands) {
      entryPoints[`island-${island.id}`] = island.url;
    }

    const absWorkingDir = Deno.cwd();
    await ensureEsbuildInialized();
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
      plugins: [denoPlugin()],
      splitting: true,
      target: target ?? ["chrome98", "firefox97", "safari14"],
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

    return cache;
  }

  async cache(target: string | undefined): Promise<Map<string, Uint8Array>> {
    let cache = this.#cache.get(target);
    if (cache === undefined) {
      cache = this.bundle(target);
      this.#cache.set(target, cache);
    }
    if (cache instanceof Promise) {
      cache = await cache;
      this.#cache.set(target, cache);
    }
    return cache as Map<string, Uint8Array>;
  }

  async get(
    path: string,
    target: string | undefined,
  ): Promise<Uint8Array | null> {
    const cache = await this.cache(target);
    return cache.get(path) ?? null;
  }

  // getPreloads(path: string): string[] {
  //   return this.#preloads.get(path) ?? [];
  // }
}
