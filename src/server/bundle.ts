import { BUILD_ID } from "./constants.ts";
import {
  BuildOptions,
  BuildResult,
  colors,
  denoPlugin,
  esbuild,
  join,
  toFileUrl,
} from "./deps.ts";
import { Island, Plugin } from "./types.ts";
import { BlobStorage, fsStorage, inMemoryStorage } from "./storage.ts";

export interface JSXConfig {
  jsx: "react" | "react-jsx";
  jsxImportSource?: string;
}

const once = (cb: () => Promise<void>) => {
  let p: Promise<void> | undefined = undefined;

  return (): Promise<void> => {
    p ??= cb();
    return p;
  };
};

const esBuildInit = once(() => esbuild.initialize({}));

const JSX_RUNTIME_MODE = {
  "react": "transform",
  "react-jsx": "automatic",
} as const;

interface Options {
  importMapURL: URL;
  jsxConfig: JSXConfig;
  islands: Island[];
  plugins: Plugin[];
  dev: boolean;
  absWorkingDir: string;
}

const bundle = async (
  { importMapURL, dev, islands, plugins, jsxConfig, absWorkingDir }: Options,
) => {
  const start = performance.now();
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

  const duration = (performance.now() - start) / 1e3;

  console.log(
    `📦 ${dev ? "Development" : "Production"} bundle ready in ${
      colors.cyan(`${duration.toFixed(1)}s`)
    }`,
  );

  return bundle;
};

const storeBundle = async (
  bundle: BuildResult,
  storage: BlobStorage,
  absWorkingDir: string,
) => {
  await storage.clear();

  if (bundle.metafile) {
    await storage.set(
      "metafile.json",
      new TextEncoder().encode(JSON.stringify(bundle.metafile)),
    );
  }

  const absDirUrlLength = toFileUrl(absWorkingDir).href.length;

  await Promise.all([
    bundle.outputFiles?.map((file) =>
      storage.set(
        toFileUrl(file.path).href.substring(absDirUrlLength),
        file.contents,
      )
    ),
  ]);
};

export const createBundle = async (
  options: Omit<Options, "absWorkingDir">,
): Promise<BlobStorage> => {
  const absWorkingDir = Deno.cwd();
  const storagePath = join(absWorkingDir, "/.frsh");
  const fs = await fsStorage(storagePath);

  if (options.dev) {
    const inMemory = inMemoryStorage();

    const [prod, dev] = await Promise.all([
      bundle({ ...options, dev: false, absWorkingDir }),
      bundle({ ...options, dev: true, absWorkingDir }),
    ]);

    await Promise.all([
      storeBundle(prod, fs, absWorkingDir),
      storeBundle(dev, inMemory, absWorkingDir),
    ]);

    return inMemory;
  }

  return fs;
};
