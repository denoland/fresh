import { AssetSnapshot, SnapshotFileInfo } from "./types.ts";

const encoder = new TextEncoder();

export function getEtag(filePath: string): Promise<string> {
  // TODO: Include file content in hashing
  return crypto.subtle.digest(
    "SHA-1",
    encoder.encode(filePath),
  ).then((hash) =>
    Array.from(new Uint8Array(hash))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  );
}

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
