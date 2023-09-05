export {
  EsbuildBuilder,
  type EsbuildBuilderOptions,
  EsbuildSnapshot,
  type JSXConfig,
} from "./esbuild.ts";
export { AotSnapshot } from "./aot_snapshot.ts";
export interface Builder {
  build(): Promise<BuildSnapshot>;
}

export interface BuildSnapshot {
  /** The list of files contained in this snapshot, not prefixed by a slash. */
  readonly paths: string[];

  /** For a given file, return it's contents.
   * @throws If the file is not contained in this snapshot. */
  read(
    path: string,
  ):
    | ReadableStream<Uint8Array>
    | Uint8Array
    | null
    | Promise<ReadableStream<Uint8Array> | Uint8Array | null>;

  /** For a given entrypoint, return it's list of dependencies.
   *
   * Returns an empty array if the entrypoint does not exist. */
  dependencies(path: string): string[];
}

export interface BuildSnapshotJson {
  build_id: string;
  files: Record<string, string[]>;
}
