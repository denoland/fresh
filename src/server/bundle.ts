import {
  BuildOptions,
  BuildResult,
} from "https://deno.land/x/esbuild@v0.17.11/mod.js";
import { BUILD_ID } from "./constants.ts";
import { deferred, denoPlugin, esbuild, toFileUrl } from "./deps.ts";
import { Island, Plugin } from "./types.ts";
import { once } from "./once.ts";

export interface JSXConfig {
  jsx: "react" | "react-jsx";
  jsxImportSource?: string;
}

const initESBuild = once(async () => {
  // deno-lint-ignore no-deprecated-deno-api
  if (typeof Deno.run !== "undefined") {
    await esbuild.initialize({});

    return;
  }

  // On Deno Deploy, let's use WASM!
  const wasmURL = new URL("./esbuild_v0.17.11.wasm", import.meta.url).href;
  const { body } = await fetch(wasmURL);
  const wasmModule = await WebAssembly.compileStreaming(
    new Response(body, {
      headers: { "Content-Type": "application/wasm" },
    }),
  );
  await esbuild.initialize({ wasmModule, worker: false });
});

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

const createBundler = ({
  islands,
  plugins,
  importMapURL,
  jsxConfig,
  dev,
}: Options) => {
  const esbuildInit = initESBuild();

  return async () => {
    console.log("Bundling assets");

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

    await esbuildInit;

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
};

const cache = (build: BuildResult) => {
  const storage = new Map<string, Uint8Array>();

  return storage;
};

// export const createAssetsStorage = async (options: Options) => {
//   const bundler = createBundler(options);
//   const build = await bundler();

//   return cache(build);
// };

export const createAssetsStorage = (options: Options) => {
  const kvPromise = createKv();
  const bundler = createBundler(options);

  // inMemoryCache used in case of failure of Deno.KV or bundle not found
  const inMemoryCache = new Map<string, Uint8Array>();

  const saveBundleOnKv = async () => {
    console.log("saving bundle on Kv");
    const kv = await kvPromise;

    if (!kv) return;

    for (const [file, content] of inMemoryCache.entries()) {
      await kv.saveFile(file, content);
    }
  };

  const bundleAndCacheOnce = once(async () => {
    const build = await bundler();

    // Save Build on inMemoryCache
    const absDirUrlLength = toFileUrl(absWorkingDir).href.length;
    for (const file of build.outputFiles!) {
      inMemoryCache.set(
        toFileUrl(file.path).href.substring(absDirUrlLength),
        file.contents,
      );
    }
    inMemoryCache.set(
      "/metafile.json",
      new TextEncoder().encode(JSON.stringify(build.metafile)),
    );

    // Fire & forget saving on KV
    saveBundleOnKv().catch((e) => console.error(e));
  });

  return {
    get: async (path: string) => {
      const maybeStream = await kvPromise
        .then((kv) => kv?.getFile(path))
        .catch(() => null);

      const file = maybeStream || inMemoryCache.get(path);

      if (file) {
        return file;
      }

      // Cache not found on both Kv or inMemory, let's build an cache it
      await bundleAndCacheOnce();

      return inMemoryCache.get(path);
    },
  };
};

type PromiseOrValue<T> = T extends Promise<infer K> ? K : T;

export type AssetsStorage = PromiseOrValue<
  ReturnType<typeof createAssetsStorage>
>;

const createKv = async () => {
  const chunksize = 65536;
  const namespace = ["_frsh", "js", BUILD_ID];
  const kv = await Deno.openKv?.();

  if (!kv) return null;

  console.log('Using KV for assets storage!')

  return {
    getFile: async (file: string) => {
      const filepath = [...namespace, file];
      const metadata = await kv.get(filepath);

      if (metadata.versionstamp === null) {
        console.log(`KV(${filepath}): NOT found`);
        return null;
      }

      console.log(`KV(${filepath}): found`);
      return new ReadableStream<Uint8Array>({
        start: async (sink) => {
          for await (const chunk of kv.list({ prefix: filepath })) {
            sink.enqueue(chunk.value as Uint8Array);
          }
          sink.close();
        },
      });
    },
    saveFile: async (file: string, content: Uint8Array) => {
      const filepath = [...namespace, file];
      const metadata = await kv.get(filepath);

      let transaction = kv.atomic();
      let chunks = 0;
      for (; chunks * chunksize < content.length; chunks++) {
        transaction = transaction.set(
          [...filepath, chunks],
          content.slice(chunks * chunksize, (chunks + 1) * chunksize),
        );
      }
      const result = await transaction
        .set(filepath, chunks)
        .check(metadata)
        .commit();

      console.log(
        result.ok ? `KV(${filepath}): saved` : `KV(${filepath}): save FAILED`,
      );

      return result.ok;
    },
  };
};
