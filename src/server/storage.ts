// deno-lint-ignore-file require-await
import { emptyDir, ensureDir, join } from "./deps.ts";

export interface BlobStorage {
  set: (key: string, value: Uint8Array) => Promise<void>;
  get: (
    key: string,
  ) => Promise<Uint8Array | ReadableStream<Uint8Array> | undefined>;
  clear: () => Promise<void>;
}

export const inMemoryStorage = (): BlobStorage => {
  const map = new Map();

  return {
    clear: async () => map.clear(),
    get: async (k: string) => map.get(k),
    set: async (k: string, v: Uint8Array) => {
      map.set(k, v);
    },
  };
};

export const fsStorage = async (rootDir: string): Promise<BlobStorage> => {
  await ensureDir(rootDir);

  return {
    clear: () => emptyDir(rootDir),
    get: async (k: string) => {
      const file = await Deno.open(join(rootDir, k), { read: true });
      return file.readable;
    },
    set: (k: string, v: Uint8Array) =>
      Deno.writeFile(join(rootDir, k), v, { create: true, append: false }),
  };
};
