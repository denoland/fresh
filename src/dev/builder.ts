import { App, type ListenOptions, setBuildCache } from "../app.ts";
import { fsAdapter } from "../fs.ts";
import * as path from "@std/path";
import * as colors from "@std/fmt/colors";
import { bundleJs, type FreshBundleOptions } from "./esbuild.ts";

import { liveReload } from "./middlewares/live_reload.ts";
import {
  cssAssetHash,
  FileTransformer,
  type OnTransformOptions,
} from "./file_transformer.ts";
import type { TransformFn } from "./file_transformer.ts";
import {
  type DevBuildCache,
  DiskBuildCache,
  type FsRoute,
  MemoryBuildCache,
} from "./dev_build_cache.ts";
import { BUILD_ID } from "../runtime/build_id.ts";
import { updateCheck } from "./update_check.ts";
import { devErrorOverlay } from "./middlewares/error_overlay/middleware.tsx";
import { automaticWorkspaceFolders } from "./middlewares/automatic_workspace_folders.ts";
import { parseDirPath } from "../config.ts";
import { pathToExportName, UniqueNamer } from "../utils.ts";
import { checkDenoCompilerOptions } from "./check.ts";
import { crawlRouteDir, walkDir } from "./fs_crawl.ts";
import { DAY } from "../constants.ts";

export interface BuildOptions {
  /**
   * This sets the target environment for the generated code. Newer
   * language constructs will be transformed to match the specified
   * support range. See https://esbuild.github.io/api/#target
   * @default {"es2022"}
   */
  target?: string | string[];
  /**
   * The root directory of the Fresh project.
   *
   * Other paths, such as `build.outDir`, `staticDir`, and `fsRoutes()`
   * are resolved relative to this directory.
   * @default Deno.cwd()
   */
  root?: string;
  /**
   * The directory to write generated files to when `dev.ts build` is run.
   *
   * This can be an absolute path, a file URL or a relative path.
   * Relative paths are resolved against the `root` option.
   * @default "_fresh"
   */
  outDir?: string;
  /**
   * The directory to serve static files from.
   *
   * This can be an absolute path, a file URL or a relative path.
   * Relative paths are resolved against the `root` option.
   * @default "static"
   */
  staticDir?: string;
  /**
   * The directory which contains islands.
   *
   * This can be an absolute path, a file URL or a relative path.
   * Relative paths are resolved against the `root` option.
   * @default "islands"
   */
  islandDir?: string;
  /**
   * The directory which contains routes.
   *
   * This can be an absolute path, a file URL or a relative path.
   * Relative paths are resolved against the `root` option.
   * @default "routes"
   */
  routeDir?: string;
  /**
   * File paths which should be ignored when crawling the file system.
   */
  ignore?: RegExp[];

  /**
   * Control if/how production source maps should be handled.
   * See https://esbuild.github.io/api/#source-maps for more information.
   */
  sourceMap?: FreshBundleOptions["sourceMap"];
}

/**
 * The final resolved Builder configuration.
 */
export type ResolvedBuildConfig = Required<Omit<BuildOptions, "sourceMap">> & {
  mode: "development" | "production";
  buildId: string;
  sourceMap?: FreshBundleOptions["sourceMap"];
};

const TEST_FILE_PATTERN = /[._]test\.(?:[tj]sx?|[mc][tj]s)$/;

// deno-lint-ignore no-explicit-any
export class Builder<State = any> {
  #transformer: FileTransformer;
  #addedInternalTransforms = false;
  config: ResolvedBuildConfig;
  #islandSpecifiers = new Set<string>();
  #fsRoutes: FsRoute<State>;
  #ready = Promise.withResolvers<void>();

  constructor(options?: BuildOptions) {
    const root = parseDirPath(options?.root ?? ".", Deno.cwd());
    const outDir = parseDirPath(options?.outDir ?? "_fresh", root);
    const staticDir = parseDirPath(options?.staticDir ?? "static", root);
    const islandDir = parseDirPath(options?.islandDir ?? "islands", root);
    const routeDir = parseDirPath(options?.routeDir ?? "routes", root);

    this.#fsRoutes = { dir: routeDir, files: [], id: "default" };

    this.#transformer = new FileTransformer(fsAdapter, root);

    this.config = {
      target: options?.target ?? ["chrome99", "firefox99", "safari15"],
      root,
      outDir,
      staticDir,
      islandDir,
      routeDir,
      ignore: options?.ignore ?? [TEST_FILE_PATTERN],
      mode: "production",
      buildId: BUILD_ID,
      sourceMap: options?.sourceMap,
    };
  }

  registerIsland(specifier: string): void {
    this.#islandSpecifiers.add(specifier);
  }

  onTransformStaticFile(
    options: OnTransformOptions,
    callback: TransformFn,
  ): void {
    this.#transformer.onTransform(options, callback);
  }

  async listen(
    importApp: () => Promise<{ app: App<State> } | App<State>>,
    options: ListenOptions = {},
  ): Promise<void> {
    // Run update check in background
    updateCheck(DAY).catch(() => {});

    this.config.mode = "development";

    await this.#crawlFsItems();

    let app = await importApp();
    if (!(app instanceof App) && "app" in app) {
      app = app.app;
    }

    const buildCache = new MemoryBuildCache<State>(
      this.config,
      this.#fsRoutes,
      this.#transformer,
    );

    await buildCache.prepare();

    const devApp = new App<State>(app.config)
      .use(liveReload())
      .use(devErrorOverlay())
      .use(automaticWorkspaceFolders(this.config.root))
      // Wait for islands to be ready
      .use(async (ctx) => {
        await this.#ready.promise;
        return ctx.next();
      })
      .mountApp("/*", app);

    devApp.config.root = this.config.root;
    devApp.config.mode = "development";

    setBuildCache(devApp, buildCache);

    // Boot in parallel to spin up the server quicker. We'll hold
    // requests until the required assets are processed.
    await Promise.all([
      devApp.listen(options),
      this.#build(buildCache, true),
    ]);
    return;
  }

  /**
   * Build optimized assets for your app. By default this will create
   * a production build.
   *
   * This can also be used for testing to apply a snapshot to a particular
   * {@linkcode App} instance.
   *
   * @example
   * ```ts
   * const builder = new Builder();
   * const applySnapshot = await builder.build({ snapshot: "memory" });
   *
   * Deno.test("My Test", () => {
   *   const app = new App()
   *     .get("/", () => new Response("hello"))
   *
   *   applySnapshot(app)
   *
   *   // ... your usual testing
   * })
   * ```
   * @param options
   * @returns Apply a snapshot to a particular {@linkcode App} instance.
   */
  async build(
    options?: {
      mode?: ResolvedBuildConfig["mode"];
      snapshot?: "disk" | "memory";
    },
  ): Promise<(app: App<State>) => void> {
    this.config.mode = options?.mode ?? "production";

    await this.#crawlFsItems();

    const buildCache = options?.snapshot === "memory"
      ? new MemoryBuildCache(
        this.config,
        this.#fsRoutes,
        this.#transformer,
      )
      : new DiskBuildCache(
        this.config,
        this.#fsRoutes,
        this.#transformer,
      );

    await this.#build(buildCache, this.config.mode === "development");
    await buildCache.prepare();

    return (app) => {
      setBuildCache(app, buildCache);
    };
  }

  async #crawlFsItems() {
    await Promise.all([
      walkDir(
        fsAdapter,
        this.config.islandDir,
        (entry) => this.registerIsland(entry.path),
        this.config.ignore,
      ),
      crawlRouteDir(
        fsAdapter,
        this.config.routeDir,
        this.config.ignore,
        (entry) => this.registerIsland(entry),
        this.#fsRoutes.files,
      ),
    ]);
  }

  async #build<T>(buildCache: DevBuildCache<T>, dev: boolean): Promise<void> {
    const { target, outDir, root } = this.config;
    const staticOutDir = path.join(outDir, "static");

    const { denoJson, jsxImportSource } = await checkDenoCompilerOptions(root);

    if (!this.#addedInternalTransforms) {
      this.#addedInternalTransforms = true;
      cssAssetHash(this.#transformer);
    }

    try {
      await Deno.remove(staticOutDir);
    } catch {
      // Ignore
    }

    const runtimePath = dev
      ? "../runtime/client/dev.ts"
      : "../runtime/client/mod.tsx";

    const entryPoints: Record<string, string> = {
      "fresh-runtime": new URL(runtimePath, import.meta.url).href,
    };

    const namer = new UniqueNamer();
    for (const spec of this.#islandSpecifiers) {
      const specName = specToName(spec);
      const name = namer.getUniqueName(specName);

      entryPoints[name] = spec;

      buildCache.islandModNameToChunk.set(name, {
        name,
        server: spec,
        browser: null,
      });
    }

    const output = await bundleJs({
      cwd: root,
      outDir: staticOutDir,
      dev: dev ?? false,
      target,
      buildId: BUILD_ID,
      entryPoints,
      jsxImportSource,
      denoJsonPath: denoJson,
      sourceMap: this.config.sourceMap,
    });

    const prefix = `/_fresh/js/${BUILD_ID}/`;

    for (const name of buildCache.islandModNameToChunk.keys()) {
      const chunkName = output.entryToChunk.get(name);
      if (chunkName === undefined) {
        throw new Error(`Could not find chunk for island ${name}`);
      }

      const pathname = `${prefix}${chunkName}`;
      buildCache.islandModNameToChunk.get(name)!.browser = pathname;
    }

    for (let i = 0; i < output.files.length; i++) {
      const file = output.files[i];
      const pathname = `${prefix}${file.path}`;
      await buildCache.addProcessedFile(pathname, file.contents, file.hash);
    }

    await buildCache.flush();

    if (!dev) {
      // deno-lint-ignore no-console
      console.log(
        `Assets written to: ${colors.cyan(outDir)}`,
      );
    }

    this.#ready.resolve();
  }
}

export function specToName(spec: string): string {
  if (/^(https?:|file:)/.test(spec)) {
    const url = new URL(spec);
    if (url.pathname === "/") {
      return pathToExportName(url.hostname);
    }

    const idx = spec.lastIndexOf("/");
    return pathToExportName(spec.slice(idx + 1));
  } else if (spec.startsWith("jsr:")) {
    const match = spec.match(
      /jsr:@([^/]+)\/([^@/]+)(@[\^~]?\d+\.\d+\.\d+([^/]+)?)?(\/.*)?$/,
    )!;
    if (match[5] === undefined) {
      return pathToExportName(`${match[1]}_${match[2]}`);
    }

    return pathToExportName(match[5]);
  } else if (spec.startsWith("npm:")) {
    const match = spec.match(
      /npm:(@([^/]+)\/([^@/]+)|[^@/]+)(@[\^~]?\d+\.\d+\.\d+([^/]+)?)?(\/.*)?$/,
    )!;

    if (match[6] === undefined) {
      if (match[2] === undefined) {
        return pathToExportName(match[1]);
      }
      return pathToExportName(`${match[2]}_${match[3]}`);
    }

    return pathToExportName(match[6]);
  }

  const match = spec.match(/^(@([^/]+)\/([^@/]+)|[^@/]+)(\/.*)?$/);
  if (match !== null) {
    if (match[4] === undefined) {
      if (match[2] !== undefined) {
        return pathToExportName(`${match[2]}_${match[3]}`);
      }

      return pathToExportName(match[1]);
    }

    return pathToExportName(match[4]);
  }

  return pathToExportName(spec);
}
