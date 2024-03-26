import { walk, WalkEntry, WalkOptions } from "@std/fs/walk";
import * as path from "@std/path";

export interface FreshFile {
  size: number;
  readable: ReadableStream<Uint8Array>;
}

export interface FsAdapter {
  walk(
    root: string | URL,
    options?: WalkOptions,
  ): AsyncIterableIterator<WalkEntry>;
  isDirectory(path: string | URL): Promise<boolean>;
  mkdirp(dir: string): Promise<void>;
  open(path: string | URL): Promise<FreshFile>;
  readTextFile(path: string | URL): Promise<string>;
}

export const fsAdapter: FsAdapter = {
  walk,
  async isDirectory(path) {
    try {
      const stat = await Deno.stat(path);
      return stat.isDirectory;
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) return false;
      throw err;
    }
  },
  async mkdirp(dir: string) {
    try {
      await Deno.mkdir(dir, { recursive: true });
    } catch (err) {
      if (!(err instanceof Deno.errors.AlreadyExists)) {
        throw err;
      }
    }
  },
  async open(path: string) {
    const [stat, opened] = await Promise.all([
      Deno.stat(path),
      Deno.open(path),
    ]);
    return {
      size: stat.size,
      readable: opened.readable,
    };
  },
  readTextFile: Deno.readTextFile,
};
