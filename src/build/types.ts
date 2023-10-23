export interface AssetSnapshot {
  /**
   * For a given file, return it's contents.
   * @throws If the file is not contained in this snapshot.
   */
  read(path: string): Promise<ReadableStream<Uint8Array> | null>;

  /**
   * For a given entrypoint, return it's list of dependencies.
   * Returns an empty array if the entrypoint does not exist.
   */
  getDependencies(path: string): string[];

  getFileInfo(path: string): Promise<SnapshotFileInfo | null>;
}

export interface SnapshotFileInfo {
  etag: string;
  size: number;
}
