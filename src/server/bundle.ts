import {
  BuildOptions,
  BuildResult,
} from "https://deno.land/x/esbuild@v0.17.11/mod.js";
import { BUILD_ID } from "./constants.ts";
import { denoPlugin, esbuild, toFileUrl } from "./deps.ts";
import { Island, Plugin } from "./types.ts";

export interface JSXConfig {
  jsx: "react" | "react-jsx";
  jsxImportSource?: string;
}

let esbuildInitialized: boolean | Promise<void> = false;
const initESBuild = async () => {
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
};

const JSX_RUNTIME_MODE = {
  "react": "transform",
  "react-jsx": "automatic",
} as const;

interface Options {
  islands: Island[];
  plugins: Plugin[];
  importMapURL: URL;
  jsxConfig: JSXConfig;
  dev: boolean;
}

const absWorkingDir = Deno.cwd();

const bundle = async ({
  islands,
  plugins,
  importMapURL,
  jsxConfig,
  dev,
}: Options) => {
  const entryPoints: Record<string, string> = {
    main: dev
      ? new URL("../../src/runtime/main_dev.ts", import.meta.url).href
      : new URL("../../src/runtime/main.ts", import.meta.url).href,
  };

  for (const island of islands) {
    entryPoints[`island-${island.id}`] = island.url;
  }

  for (const plugin of plugins) {
    for (const [name, url] of Object.entries(plugin.entrypoints ?? {})) {
      entryPoints[`plugin-${plugin.name}-${name}`] = url;
    }
  }

  await initESBuild();

  // In dev-mode we skip identifier minification to be able to show proper
  // component names in Preact DevTools instead of single characters.
  const minifyOptions: Partial<BuildOptions> = dev
    ? { minifyIdentifiers: false, minifySyntax: true, minifyWhitespace: true }
    : { minify: true };

  return esbuild.build({
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
    plugins: [denoPlugin({ importMapURL: importMapURL })],
    sourcemap: dev ? "linked" : false,
    splitting: true,
    target: ["chrome99", "firefox99", "safari15"],
    treeShaking: true,
    write: false,
    jsx: JSX_RUNTIME_MODE[jsxConfig.jsx],
    jsxImportSource: jsxConfig.jsxImportSource,
  });
};

const cache = (build: BuildResult) => {
  const storage = new Map<string, Uint8Array>();

  const absDirUrlLength = toFileUrl(absWorkingDir).href.length;
  for (const file of build.outputFiles!) {
    storage.set(
      toFileUrl(file.path).href.substring(absDirUrlLength),
      file.contents,
    );
  }
  storage.set(
    "/metafile.json",
    new TextEncoder().encode(JSON.stringify(build.metafile)),
  );

  return storage;
};

export const createAssetsStorage = async (options: Options) => {
  const build = await bundle(options);

  return cache(build);
};

type PromiseOrValue<T> = T extends Promise<infer K> ? K : T

export type AssetsStorage = PromiseOrValue<ReturnType<typeof createAssetsStorage>>