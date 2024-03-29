import {
  type App,
  FreshApp,
  GLOBAL_ISLANDS,
  type Island,
  type ListenOptions,
} from "../app.ts";
import type { FreshConfig } from "../config.ts";
import { fsAdapter } from "../fs.ts";
import * as path from "@std/path";
import * as colors from "@std/fmt/colors";
import { bundleJs } from "./esbuild.ts";
import * as JSONC from "@std/jsonc";
import { prettyTime } from "../utils.ts";
import { liveReload } from "./middlewares/live_reload.ts";
import {
  FreshFileTransformer,
  type OnTransformArgs,
  type OnTransformOptions,
} from "./file_transformer.ts";
import type { TransformFn } from "./file_transformer.ts";
import { DiskBuildCache, MemoryBuildCache } from "./dev_build_cache.ts";

export interface DevApp<T> extends App<T> {
  onTransformStaticFile(
    options: OnTransformOptions,
    callback: TransformFn,
  ): void;
}

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

export class FreshDevApp<T> extends FreshApp<T> implements DevApp<T> {
  #transformer = new FreshFileTransformer();

  constructor(config: FreshConfig = {}) {
    super(config);

    this.use(liveReload());
  }

  onTransformStaticFile(
    options: OnTransformOptions,
    callback: (args: OnTransformArgs) => void,
  ): void {
    this.#transformer.onTransform(options, callback);
  }

  async listen(options: ListenOptions = {}): Promise<void> {
    if (options.hostname === undefined) {
      options.hostname = "localhost";
    }

    if (options.port === undefined) {
      options.port = await getFreePort(8000, options.hostname);
    }

    await this.build({ dev: true });
    await super.listen(options);
    return;
  }

  async build(options: BuildOptions = {}): Promise<void> {
    const start = Date.now();
    console.log(`Building...`);
    const { staticDir, build } = this.config;
    const staticOutDir = path.join(build.outDir, "static");

    const target = options.target ?? ["chrome99", "firefox99", "safari15"];

    try {
      await Deno.remove(staticOutDir);
    } catch {
      // Ignore
    }

    const buildCache = options.dev
      ? new MemoryBuildCache(this.config)
      : new DiskBuildCache(this.config);
    this.buildCache = buildCache;

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

        const relative = path.relative(staticDir, entry.path);
        const pathname = `/${relative}`;
        if (result === null) {
          buildCache.addUnprocessedFile(pathname);
        } else {
          await buildCache.addProcessedFile(pathname, result, null);
        }
      }
    }

    const entryPoints: Record<string, string> = {
      "fresh-runtime": options.dev
        ? "@fresh/core/runtime-dev"
        : "@fresh/core/runtime",
    };
    const seenEntries = new Map<string, Island>();
    const mapIslandToEntry = new Map<Island, string>();
    for (const island of GLOBAL_ISLANDS.values()) {
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

    const denoJson = await readDenoConfig(this.config.root);

    const jsxImportSource = denoJson.config.compilerOptions?.jsxImportSource;
    if (jsxImportSource === undefined) {
      throw new Error(
        `Option compilerOptions > jsxImportSource not set in: ${denoJson.filePath}`,
      );
    }

    const output = await bundleJs({
      cwd: Deno.cwd(),
      outDir: staticOutDir,
      dev: options.dev ?? false,
      target,
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

    const duration = Date.now() - start;
    console.log(
      `Build finished in ${colors.green(prettyTime(duration))}`,
    );
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
