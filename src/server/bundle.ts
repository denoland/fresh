import { denoPlugin, esbuild, esbuildTypes, toFileUrl } from "./deps.ts";
import { Island } from "./types.ts";

let esbuildInitalized: boolean | Promise<void> = false;
async function ensureEsbuildInialized() {
  if (esbuildInitalized === false) {
    if (Deno.run === undefined) {
      esbuildInitalized = esbuild.initialize({
        wasmURL: "https://unpkg.com/esbuild-wasm@0.11.19/esbuild.wasm",
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
  #cache: Map<string, Uint8Array> | Promise<void> | undefined = undefined;

  constructor(islands: Island[]) {
    this.#islands = islands;
  }

  async bundle() {
    const entryPoints: Record<string, string> = {};

    for (const island of this.#islands) {
      entryPoints[island.id] = `fresh:///${island.id}`;
    }

    const absWorkingDir = Deno.cwd();
    await ensureEsbuildInialized();
    const bundle = await esbuild.build({
      bundle: true,
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
      plugins: [freshPlugin(this.#islands), denoPlugin()],
      splitting: true,
      target: ["chrome90", "firefox88", "safari13"],
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

function freshPlugin(islands: Island[]): esbuildTypes.Plugin {
  const runtime = new URL("../../runtime.ts", import.meta.url);

  const islandMap = new Map<string, Island>();

  for (const island of islands) {
    islandMap.set(`/${island.id}`, island);
  }

  return {
    name: "fresh",
    setup(build) {
      build.onResolve({ filter: /fresh:\/\/.*/ }, function onResolve(
        args: esbuildTypes.OnResolveArgs,
      ): esbuildTypes.OnResolveResult | null | undefined {
        return ({
          path: args.path,
          namespace: "fresh",
        });
      });

      build.onLoad(
        { filter: /.*/, namespace: "fresh" },
        function onLoad(
          args: esbuildTypes.OnLoadArgs,
        ): esbuildTypes.OnLoadResult | null | undefined {
          const url = new URL(args.path);
          const path = url.pathname;
          const island = islandMap.get(path);
          if (!island) return null;
          const contents = `
import ${island.name} from "${island.url}";
import { h, render } from "${runtime.href}";

class ${island.name}Island extends HTMLElement {
  constructor() {
    super();
    const props = JSON.parse(this.getAttribute("props"));
    render(h(${island.name}, props), this);
  }
}

customElements.define("frsh-${island.id}", ${island.name}Island);
`;
          return { contents, loader: "js" };
        },
      );
    },
  };
}
