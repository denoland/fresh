import * as path from "@std/path";
import { getSnapshotPath, type ResolvedFreshConfig } from "./config.ts";
import { DENO_DEPLOYMENT_ID, setBuildId } from "./runtime/build_id.ts";
import * as colors from "@std/fmt/colors";

export interface FileSnapshot {
  generated: boolean;
  hash: string | null;
}

export interface BuildSnapshot {
  version: number;
  buildId: string;
  staticFiles: Record<string, FileSnapshot>;
  islands: Record<string, string>;
}

export interface StaticFile {
  hash: string | null;
  size: number;
  readable: ReadableStream<Uint8Array> | Uint8Array;
  close(): void;
}

export interface BuildCache {
  hasSnapshot: boolean;
  readFile(pathname: string): Promise<StaticFile | null>;
  getIslandChunkName(islandName: string): string | null;
}

export class ProdBuildCache implements BuildCache {
  static fromSnapshot(config: ResolvedFreshConfig, islandCount: number) {
    const snapshotPath = getSnapshotPath(config);

    const staticFiles = new Map<string, FileSnapshot>();
    const islandToChunk = new Map<string, string>();

    let hasSnapshot = false;
    try {
      const content = Deno.readTextFileSync(snapshotPath);
      const snapshot = JSON.parse(content) as BuildSnapshot;
      hasSnapshot = true;
      setBuildId(snapshot.buildId);

      const files = Object.keys(snapshot.staticFiles);
      for (let i = 0; i < files.length; i++) {
        const pathname = files[i];
        const info = snapshot.staticFiles[pathname];
        staticFiles.set(pathname, info);
      }

      const islands = Object.keys(snapshot.islands);
      for (let i = 0; i < islands.length; i++) {
        const pathname = islands[i];
        islandToChunk.set(pathname, snapshot.islands[pathname]);
      }

      if (!DENO_DEPLOYMENT_ID) {
        // deno-lint-ignore no-console
        console.log(
          `Found snapshot at ${colors.cyan(snapshotPath)}`,
        );
      }
    } catch (err) {
      if ((err instanceof Deno.errors.NotFound)) {
        if (islandCount > 0) {
          throw new Error(
            `Found ${
              colors.green(`${islandCount} islands`)
            }, but did not find build snapshot at:\n${
              colors.red(snapshotPath)
            }.\n\nMaybe your forgot to run ${
              colors.cyan("deno task build")
            } before starting the production server\nor maybe you wanted to run ${
              colors.cyan("deno task dev")
            } to spin up a development server instead?\n`,
          );
        }
      } else {
        throw err;
      }
    }

    return new ProdBuildCache(config, islandToChunk, staticFiles, hasSnapshot);
  }

  #islands: Map<string, string>;
  #fileInfo: Map<string, FileSnapshot>;
  #config: ResolvedFreshConfig;

  constructor(
    config: ResolvedFreshConfig,
    islands: Map<string, string>,
    files: Map<string, FileSnapshot>,
    public hasSnapshot: boolean,
  ) {
    this.#islands = islands;
    this.#fileInfo = files;
    this.#config = config;
  }

  async readFile(pathname: string): Promise<StaticFile | null> {
    const info = this.#fileInfo.get(pathname);
    if (info === undefined) return null;

    const base = info.generated
      ? this.#config.buildOutDir
      : this.#config.staticDir;
    const filePath = info.generated
      ? path.join(base, "static", pathname)
      : path.join(base, pathname);

    // Check if path resolves outside of intended directory.
    if (path.relative(base, filePath).startsWith(".")) {
      return null;
    }

    const [stat, file] = await Promise.all([
      Deno.stat(filePath),
      Deno.open(filePath),
    ]);

    return {
      hash: info.hash,
      size: stat.size,
      readable: file.readable,
      close: () => file.close(),
    };
  }

  getIslandChunkName(islandName: string): string | null {
    return this.#islands.get(islandName) ?? null;
  }
}
