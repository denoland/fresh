import { FreshApp, GLOBAL_ISLANDS, ListenOptions } from "../app.ts";
import { FreshConfig } from "../config.ts";
import { fsAdapter } from "../fs.ts";
import { BuildCacheSnapshot } from "../build_cache.ts";
import * as path from "@std/path";
import { getSnapshotPath } from "../fs.ts";
import { crypto } from "@std/crypto";
import * as colors from "@std/fmt/colors";
import { encodeHex } from "@std/encoding/hex";
import { bundleJs } from "./esbuild.ts";
import * as JSONC from "@std/jsonc";
import { prettyTime } from "../utils.ts";

export class FreshDevApp<T> extends FreshApp<T> {
  constructor(config: FreshConfig = {}) {
    super(config);
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

  async build(options: { dev?: boolean } = {}): Promise<void> {
    const start = Date.now();
    const { staticDir, build } = this.config;

    const snapshot: BuildCacheSnapshot = {
      version: 1,
      staticFiles: {},
    };

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
        const file = await Deno.open(entry.path, { read: true });
        const hashBuf = await crypto.subtle.digest(
          "SHA-256",
          file.readable,
        );
        const hash = encodeHex(hashBuf);

        const relative = path.relative(staticDir, entry.path);
        const pathname = `/${relative}`;
        snapshot.staticFiles[pathname] = hash;
      }
    }

    const entryPoints = new Set([
      ...Array.from(GLOBAL_ISLANDS.values()).map((entry) => {
        return entry.file instanceof URL ? entry.file.href : entry.file;
      }),
    ]);

    const denoJson = await readDenoConfig(this.config.root);

    const jsxImportSource = denoJson.config.compilerOptions?.jsxImportSource;
    if (jsxImportSource === undefined) {
      throw new Error(
        `Option compilerOptions > jsxImportSource not set in: ${denoJson.filePath}`,
      );
    }

    await await bundleJs({
      cwd: build.outDir,
      dev: options.dev ?? false,
      target: build.target,
      entryPoints: Array.from(entryPoints),
      jsxImportSource,
      denoJsonPath: denoJson.filePath,
    });

    await Deno.writeTextFile(
      getSnapshotPath(build.outDir),
      JSON.stringify(snapshot, null, 2),
    );

    const duration = Date.now() - start;
    const buildKind = options.dev ? "development" : "production";
    console.log(
      `Bundling ${buildKind} assets finished in ${
        colors.green(prettyTime(duration))
      }`,
    );
    console.log(
      `Assets written to: ${colors.cyan(build.outDir)}`,
    );
  }
}

export function getFreePort(
  startPort: number,
  hostname: string,
): number {
  // No port specified, check for a free port. Instead of picking just
  // any port we'll check if the next one is free for UX reasons.
  // That way the user only needs to increment a number when running
  // multiple apps vs having to remember completely different ports.
  let firstError;
  for (let port = startPort; port < startPort + 20; port++) {
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
