import { BuildOptions } from "https://deno.land/x/esbuild@v0.17.11/mod.js";
import { BUILD_ID } from "./constants.ts";
import { denoPlugin, esbuild, toFileUrl } from "./deps.ts";
import { Island, Plugin } from "./types.ts";

export interface JSXConfig {
  jsx: "react" | "react-jsx";
  jsxImportSource?: string;
}

let esbuildInitialized: boolean | Promise<void> = false;
async function ensureEsbuildInitialized() {
  if (esbuildInitialized === false) {
    // deno-lint-ignore no-deprecated-deno-api
    if (Deno.run === undefined) {
      const wasmURL = new URL("./esbuild_v0.17.11.wasm", import.meta.url).href;
      esbuildInitialized = fetch(wasmURL).then(async (r) => {
        const resp = new Response(r.body, {
          headers: { "Content-Type": "application/wasm" },
        });
        const wasmModule = await WebAssembly.compileStreaming(resp);
        await esbuild.initialize({
          wasmModule,
          worker: false,
        });
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

const JSX_RUNTIME_MODE = {
  "react": "transform",
  "react-jsx": "automatic",
} as const;

export class Bundler {
  #importMapURL: URL;
  #jsxConfig: JSXConfig;
  #islands: Island[];
  #plugins: Plugin[];
  #cache: Map<string, Uint8Array> | Promise<void> | undefined = undefined;
  #dev: boolean;

  constructor(
    islands: Island[],
    plugins: Plugin[],
    importMapURL: URL,
    jsxConfig: JSXConfig,
    dev: boolean,
  ) {
    this.#islands = islands;
    this.#plugins = plugins;
    this.#importMapURL = importMapURL;
    this.#jsxConfig = jsxConfig;
    this.#dev = dev;
  }

  async bundle() {
    const entryPoints: Record<string, string> = {
      main: this.#dev
        ? new URL("../../src/runtime/main_dev.ts", import.meta.url).href
        : new URL("../../src/runtime/main.ts", import.meta.url).href,
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
    // In dev-mode we skip identifier minification to be able to show proper
    // component names in Preact DevTools instead of single characters.
    const minifyOptions: Partial<BuildOptions> = this.#dev
      ? { minifyIdentifiers: false, minifySyntax: true, minifyWhitespace: true }
      : { minify: true };
    const bundle = await esbuild.build({
      bundle: true,
      define: { __FRSH_BUILD_ID: `"${BUILD_ID}"` },
      entryPoints,
      format: "esm",
      metafile: true,
      ...minifyOptions,
      outdir: ".",
      // This is requried to ensure the format of the outputFiles path is the same
      // between windows and linux
      absWorkingDir,
      outfile: "",
      platform: "neutral",
      plugins: [denoPlugin({ importMapURL: this.#importMapURL })],
      sourcemap: this.#dev ? "linked" : false,
      splitting: true,
      target: ["chrome99", "firefox99", "safari15"],
      treeShaking: true,
      write: false,
      jsx: JSX_RUNTIME_MODE[this.#jsxConfig.jsx],
      jsxImportSource: this.#jsxConfig.jsxImportSource,
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
