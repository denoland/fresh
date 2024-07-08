import {
  App,
  getBuildCache,
  getIslandRegistry,
  type ListenOptions,
  setBuildCache,
} from "../app.ts";
import { fsAdapter } from "../fs.ts";
import * as path from "@std/path";
import * as colors from "@std/fmt/colors";
import { bundleJs } from "./esbuild.ts";
import * as JSONC from "@std/jsonc";
import { liveReload } from "./middlewares/live_reload.ts";
import {
  cssAssetHash,
  FreshFileTransformer,
  type OnTransformOptions,
} from "./file_transformer.ts";
import type { TransformFn } from "./file_transformer.ts";
import { DiskBuildCache, MemoryBuildCache } from "./dev_build_cache.ts";
import type { Island } from "../context.ts";
import { BUILD_ID } from "../runtime/build_id.ts";
import { updateCheck } from "./update_check.ts";
import { DAY } from "@std/datetime";
import { devErrorOverlay } from "./middlewares/error_overlay/middleware.tsx";

export interface BuildOptions {
  /**
   * This sets the target environment for the generated code. Newer
   * language constructs will be transformed to match the specified
   * support range. See https://esbuild.github.io/api/#target
   * @default {"es2022"}
   */
  target?: string | string[];
}

export interface FreshBuilder {
  onTransformStaticFile(
    options: OnTransformOptions,
    callback: TransformFn,
  ): void;
  build<T>(app: App<T>, options?: BuildOptions): Promise<void>;
  listen<T>(app: App<T>, options?: ListenOptions & BuildOptions): Promise<void>;
}

export class Builder implements FreshBuilder {
  #transformer = new FreshFileTransformer(fsAdapter);
  #addedInternalTransforms = false;
  #options: { target: string | string[] };

  constructor(options: BuildOptions = {}) {
    this.#options = {
      target: options.target ?? ["chrome99", "firefox99", "safari15"],
    };
  }

  onTransformStaticFile(
    options: OnTransformOptions,
    callback: TransformFn,
  ): void {
    this.#transformer.onTransform(options, callback);
  }

  async listen<T>(app: App<T>, options: ListenOptions = {}): Promise<void> {
    // Run update check in background
    updateCheck(DAY).catch(() => {});

    const devApp = new App<T>(app.config)
      .use(liveReload())
      .use(devErrorOverlay())
      .mountApp("*", app);

    devApp.config.mode = "development";

    setBuildCache(
      devApp,
      new MemoryBuildCache(
        devApp.config,
        BUILD_ID,
        this.#transformer,
        this.#options.target,
      ),
    );

    await Promise.all([
      devApp.listen(options),
      this.#build(devApp, true),
    ]);
    return;
  }

  async build<T>(app: App<T>): Promise<void> {
    setBuildCache(
      app,
      new DiskBuildCache(
        app.config,
        BUILD_ID,
        this.#transformer,
        this.#options.target,
      ),
    );

    return await this.#build(app, false);
  }

  async #build<T>(app: App<T>, dev: boolean): Promise<void> {
    const { build } = app.config;
    const staticOutDir = path.join(build.outDir, "static");

    if (!this.#addedInternalTransforms) {
      this.#addedInternalTransforms = true;
      cssAssetHash(this.#transformer);
    }

    const target = this.#options.target;

    try {
      await Deno.remove(staticOutDir);
    } catch {
      // Ignore
    }

    const buildCache = getBuildCache(app)! as
      | MemoryBuildCache
      | DiskBuildCache;

    const runtimePath = dev
      ? "../runtime/client/dev.ts"
      : "../runtime/client/mod.tsx";

    const entryPoints: Record<string, string> = {
      "fresh-runtime": new URL(runtimePath, import.meta.url).href,
    };
    const seenEntries = new Map<string, Island>();
    const mapIslandToEntry = new Map<Island, string>();
    const islandRegistry = getIslandRegistry(app);
    for (const island of islandRegistry.values()) {
      const filePath = island.file instanceof URL
        ? island.file.href
        : island.file;

      const seen = seenEntries.get(filePath);
      if (seen !== undefined) {
        mapIslandToEntry.set(island, seen.name);
      } else {
        entryPoints[island.name] = filePath;
        seenEntries.set(filePath, island);
        mapIslandToEntry.set(island, island.name);
      }
    }

    const denoJson = await readDenoConfig(app.config.root);

    const jsxImportSource = denoJson.config.compilerOptions?.jsxImportSource;
    if (jsxImportSource === undefined) {
      throw new Error(
        `Option compilerOptions > jsxImportSource not set in: ${denoJson.filePath}`,
      );
    }

    // Check precompile option
    if (denoJson.config.compilerOptions?.jsx === "precompile") {
      const expected = ["a", "img", "source", "body", "html", "head"];
      const skipped = denoJson.config.compilerOptions.jsxPrecompileSkipElements;
      if (!skipped || expected.some((name) => !skipped.includes(name))) {
        throw new Error(
          `Expected option compilerOptions > jsxPrecompileSkipElements to contain ${
            expected.map((name) => `"${name}"`).join(", ")
          }`,
        );
      }
    }

    const output = await bundleJs({
      cwd: app.config.root,
      outDir: staticOutDir,
      dev: dev ?? false,
      target,
      buildId: BUILD_ID,
      entryPoints,
      jsxImportSource,
      denoJsonPath: denoJson.filePath,
    });

    for (let i = 0; i < output.files.length; i++) {
      const file = output.files[i];
      const pathname = `/${file.path}`;
      await buildCache.addProcessedFile(pathname, file.contents, file.hash);
    }

    // Go through same entry islands
    for (const [island, entry] of mapIslandToEntry.entries()) {
      const chunk = output.entryToChunk.get(entry);
      if (chunk === undefined) {
        throw new Error(
          `Missing chunk for ${island.file}#${island.exportName}`,
        );
      }
      buildCache.islands.set(island.name, `/${chunk}`);
    }

    await buildCache.flush();

    if (!dev) {
      // deno-lint-ignore no-console
      console.log(
        `Assets written to: ${colors.cyan(build.outDir)}`,
      );
    }
  }
}

export interface DenoConfig {
  imports?: Record<string, string>;
  importMap?: string;
  tasks?: Record<string, string>;
  lint?: {
    rules: { tags?: string[] };
    exclude?: string[];
  };
  fmt?: {
    exclude?: string[];
  };
  exclude?: string[];
  compilerOptions?: {
    jsx?: string;
    jsxImportSource?: string;
    jsxPrecompileSkipElements?: string[];
  };
}

export async function readDenoConfig(
  directory: string,
): Promise<{ config: DenoConfig; filePath: string }> {
  let dir = directory;
  while (true) {
    for (const name of ["deno.json", "deno.jsonc"]) {
      const filePath = path.join(dir, name);
      try {
        const file = await Deno.readTextFile(filePath);
        if (name.endsWith(".jsonc")) {
          return { config: JSONC.parse(file) as DenoConfig, filePath };
        } else {
          return { config: JSON.parse(file), filePath };
        }
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          throw err;
        }
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        `Could not find a deno.json file in the current directory or any parent directory.`,
      );
    }
    dir = parent;
  }
}
