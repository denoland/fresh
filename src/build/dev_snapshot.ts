import { AssetSnapshot, SnapshotFileInfo } from "./types.ts";

export class DevSnapshot implements AssetSnapshot {
  #files: Map<string, Uint8Array>;
  #dependencies: Map<string, string[]>;

  constructor(
    files: Map<string, Uint8Array>,
    dependencies: Map<string, string[]>,
  ) {
    this.#files = files;
    this.#dependencies = dependencies;
  }

  async read(path: string): Promise<ReadableStream<Uint8Array> | null> {
    return null;
  }

  getDependencies(path: string): string[] {
    return this.#dependencies.get(path) ?? [];
  }

  async getFileInfo(path: string): Promise<SnapshotFileInfo | null> {
    return null;
  }
}
