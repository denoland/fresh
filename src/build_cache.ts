import { FreshFile, FsAdapter } from "./fs.ts";
import * as path from "@std/path";

export const BUILD_CACHE_VERSION_1 = 1;

export class StaticFile {
  #fs: Pick<FsAdapter, "open">;
  #path: string;
  constructor(
    fs: Pick<FsAdapter, "open">,
    public hash: string | null,
    path: string,
  ) {
    this.#fs = fs;
    this.#path = path;
  }

  open(): Promise<FreshFile> {
    return this.#fs.open(this.#path);
  }
}

export interface FileSnapshot {
  generated: boolean;
  hash: string | null;
}

export interface BuildSnapshot {
  version: number;
  staticFiles: Record<string, FileSnapshot>;
  islands: Record<string, string>;
}

export interface BuildCache {
  getFile(pathname: string): StaticFile | null;
  islandToChunk(name: string): string;
}

export class FreshBuildCache implements BuildCache {
  #files = new Map<string, StaticFile | null>();
  #islands = new Map<string, string>();

  constructor(
    snapshot: BuildSnapshot | null,
    outDir: string,
    staticDir: string,
    fs: Pick<FsAdapter, "open">,
  ) {
    if (snapshot !== null) {
      const files = Object.keys(snapshot.staticFiles);
      for (let i = 0; i < files.length; i++) {
        const pathname = files[i];
        const info = snapshot.staticFiles[pathname];
        const filePath = info.generated
          ? path.join(outDir, "static", pathname)
          : path.join(staticDir, pathname);
        const file = new StaticFile(fs, info.hash, filePath);
        this.#files.set(pathname, file);
      }

      const islands = Object.keys(snapshot.islands);
      for (let i = 0; i < islands.length; i++) {
        const pathname = islands[i];
        this.#islands.set(pathname, snapshot.islands[pathname]);
      }
    }
  }

  islandToChunk(name: string): string {
    const chunk = this.#islands.get(name);
    if (chunk === undefined) {
      throw new Error(`Could not find chunk for island: ${name}`);
    }
    return chunk;
  }

  getFile(pathname: string): StaticFile | null {
    const info = this.#files.get(pathname);
    return info === undefined ? null : info;
  }
}
