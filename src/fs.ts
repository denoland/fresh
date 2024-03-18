import { walk, WalkEntry, WalkOptions } from "@std/fs/walk";
import * as path from "@std/path";

export interface FsAdapter {
  walk(
    root: string | URL,
    options?: WalkOptions,
  ): AsyncIterableIterator<WalkEntry>;
  isDirectory(path: string | URL): Promise<boolean>;
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
};

export function getSnapshotPath(dir: string): string {
  return path.join(dir, "snapshot.json");
}
