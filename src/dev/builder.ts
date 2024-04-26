import { App, type ListenOptions } from "../app.ts";
import { fsAdapter } from "../fs.ts";
import * as path from "@std/path";
import * as colors from "@std/fmt/colors";
import { bundleJs } from "./esbuild.ts";
import * as JSONC from "@std/jsonc";
import { liveReload } from "./middlewares/live_reload.ts";
import {
  FreshFileTransformer,
  type OnTransformOptions,
} from "./file_transformer.ts";
import type { TransformFn } from "./file_transformer.ts";
import { DiskBuildCache, MemoryBuildCache } from "./dev_build_cache.ts";
import type { Island } from "../context.ts";
import { BUILD_ID } from "../runtime/build_id.ts";

export interface BuildOptions {
  dev?: boolean;
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
  listen<T>(app: App<T>, options?: ListenOptions): Promise<void>;
}

export class Builder implements FreshBuilder {
  #transformer = new FreshFileTransformer(fsAdapter);

  onTransformStaticFile(
    options: OnTransformOptions,
    callback: TransformFn,
  ): void {
    this.#transformer.onTransform(options, callback);
  }

  async listen<T>(app: App<T>, options: ListenOptions = {}): Promise<void> {
    const devApp = new App<T>(app.config)
      .use(liveReload())
      .mountApp("*", app);

    if (options.hostname === undefined) {
      options.hostname = "localhost";
    }

    if (options.port === undefined) {
      options.port = await getFreePort(8000, options.hostname);
    }

    devApp._buildCache = new MemoryBuildCache(
      devApp.config,
      BUILD_ID,
    );

    await Promise.all([
      devApp.listen(options),
      this.build(devApp, { dev: true }),
    ]);
    return;
  }

  async build<T>(app: App<T>, options: BuildOptions = {}): Promise<void> {
    const { staticDir, build } = app.config;
    const staticOutDir = path.join(build.outDir, "static");

    const target = options.target ?? ["chrome99", "firefox99", "safari15"];

    try {
      await Deno.remove(staticOutDir);
    } catch {
      // Ignore
    }

    const buildCache = app._buildCache ?? options.dev
      ? new MemoryBuildCache(app.config, BUILD_ID)
      : new DiskBuildCache(app.config, BUILD_ID);
    app._buildCache = buildCache;

    const entryPoints: Record<string, string> = {
      "fresh-runtime": options.dev
        ? "@fresh/core/client-dev"
        : "@fresh/core/client",
    };
    const seenEntries = new Map<string, Island>();
    const mapIslandToEntry = new Map<Island, string>();
    for (const island of app._islandRegistry.values()) {
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
      cwd: Deno.cwd(),
      outDir: staticOutDir,
      dev: options.dev ?? false,
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

    // Read static files
    if (await fsAdapter.isDirectory(staticDir)) {
      const entries = fsAdapter.walk(staticDir, {
        includeDirs: false,
        includeFiles: true,
        followSymlinks: false,
        // Skip any folder or file starting with a "."
        skip: [/\/\.[^/]+(\/|$)/],
      });

      for await (const entry of entries) {
        const result = await this.#transformer.process(
          entry.path,
          options.dev ? "development" : "production",
          target,
        );

        if (result !== null) {
          for (let i = 0; i < result.length; i++) {
            const file = result[i];
            const relative = path.relative(staticDir, file.path);
            if (relative.startsWith(".")) {
              throw new Error(
                `Processed file resolved outside of static dir ${file.path}`,
              );
            }
            const pathname = `/${relative}`;

            if (typeof file.content === "function") {
              await buildCache.addLazyProcessedFile(pathname, file.content);
            } else {
              await buildCache.addProcessedFile(pathname, file.content, null);
            }
          }
        } else {
          const relative = path.relative(staticDir, entry.path);
          const pathname = `/${relative}`;
          buildCache.addUnprocessedFile(pathname);
        }
      }
    }

    await buildCache.flush();

    if (!options.dev) {
      console.log(
        `Assets written to: ${colors.cyan(build.outDir)}`,
      );
    }
  }
}

export function getFreePort(
  startPort: number,
  hostname: string,
  max: number = 20,
): number {
  // No port specified, check for a free port. Instead of picking just
  // any port we'll check if the next one is free for UX reasons.
  // That way the user only needs to increment a number when running
  // multiple apps vs having to remember completely different ports.
  let firstError;
  for (let port = startPort; port < startPort + max; port++) {
    try {
      const listener = Deno.listen({ port, hostname });
      listener.close();
      return port;
    } catch (err) {
      if (err instanceof Deno.errors.AddrInUse) {
        // Throw first EADDRINUSE error
        // if no port is free
        if (!firstError) {
          firstError = err;
        }
        continue;
      }

      throw err;
    }
  }

  throw firstError;
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
