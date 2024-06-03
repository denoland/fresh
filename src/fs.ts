import { walk, type WalkEntry, type WalkOptions } from "@std/fs/walk";

export interface FreshFile {
  size: number;
  readable: ReadableStream<Uint8Array>;
}

export interface FsAdapter {
  cwd(): string;
  walk(
    root: string | URL,
    options?: WalkOptions,
  ): AsyncIterableIterator<WalkEntry>;
  isDirectory(path: string | URL): Promise<boolean>;
  mkdirp(dir: string): Promise<void>;
  readFile(path: string | URL): Promise<Uint8Array>;
}

export const fsAdapter: FsAdapter = {
  walk,
  cwd: Deno.cwd,
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
  readFile: Deno.readFile,
};
