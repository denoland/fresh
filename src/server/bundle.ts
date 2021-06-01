import { denoPlugin, esbuild } from "./deps.ts";
import { Page } from "./page.ts";

let esbuildInitalized: boolean | Promise<void> = false;
async function ensureEsbuildInialized() {
  if (esbuildInitalized === false) {
    esbuildInitalized = esbuild.initialize({
      wasmURL: "https://unpkg.com/esbuild-wasm@0.11.19/esbuild.wasm",
      worker: false,
    });
    await esbuildInitalized;
    esbuildInitalized = true;
  } else if (esbuildInitalized instanceof Promise) {
    await esbuildInitalized;
  }
}

export class Bundler {
  #pages: Page[];
  #cache: Map<string, Uint8Array> | Promise<void> | undefined = undefined;

  constructor(pages: Page[]) {
    this.#pages = pages;
  }

  async bundle() {
    const entryPoints: Record<string, string> = {};

    for (const page of this.#pages) {
      entryPoints[page.name] = `fresh:///${page.name}`;
    }

    await ensureEsbuildInialized();
    const bundle = await esbuild.build({
      plugins: [freshPlugin(this.#pages), denoPlugin({ loader: "portable" })],
      write: false,
      bundle: true,
      minify: true,
      treeShaking: true,
      splitting: true,
      platform: "neutral",
      outfile: "",
      jsxFactory: "h",
      jsxFragment: "Fragment",
      outdir: `/`,
      entryPoints,
    });

    const cache = new Map<string, Uint8Array>();
    for (const file of bundle.outputFiles) {
      cache.set(file.path, file.contents);
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
}

function freshPlugin(pageList: Page[]): esbuild.Plugin {
  const runtime = new URL("../../runtime.ts", import.meta.url);

  const pageMap = new Map<string, Page>();

  for (const page of pageList) {
    pageMap.set(`/${page.name}`, page);
  }

  return {
    name: "fresh",
    setup(build) {
      build.onResolve({ filter: /fresh:\/\/.*/ }, function onResolve(
        args: esbuild.OnResolveArgs,
      ): esbuild.OnResolveResult | null | undefined {
        return ({
          path: args.path,
          namespace: "fresh",
        });
      });

      build.onLoad(
        { filter: /.*/, namespace: "fresh" },
        function onLoad(
          args: esbuild.OnLoadArgs,
        ): esbuild.OnLoadResult | null | undefined {
          const url = new URL(args.path);
          const path = url.pathname;
          const page = pageMap.get(path);
          if (!page) return null;
          const contents = `
import Page from "${page.url}";
import { h, render } from "${runtime.href}";

addEventListener("DOMContentLoaded", () => {
  const props = JSON.parse(document.getElementById("__FRSH_PROPS").textContent);
  render(h(Page, props), document.body);  
});
`;
          return { contents, loader: "js" };
        },
      );
    },
  };
}
