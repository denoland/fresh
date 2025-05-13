import { walk, type WalkEntry, type WalkOptions } from "@std/fs/walk";

export interface FsAdapter {
  walk(
    root: string | URL,
    options?: WalkOptions,
  ): AsyncIterableIterator<WalkEntry>;
  mkdirp(dir: string): Promise<void>;
}

export const fsAdapter: FsAdapter = {
  walk,
  async mkdirp(dir: string) {
    try {
      await Deno.mkdir(dir, { recursive: true });
    } catch (err) {
      if (!(err instanceof Deno.errors.AlreadyExists)) {
        throw err;
      }
    }
  },
};

export async function isDirectory(path: string | URL): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isDirectory;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return false;
    throw err;
  }
}
