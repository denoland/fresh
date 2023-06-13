export {
  EsbuildBuilder,
  type EsbuildBuilderOptions,
  type JSXConfig,
} from "./esbuild.ts";
export interface Builder {
  build(): Promise<void>;

  /** For a given file, return it's contents.
   * @throws If the file is not contained in this snapshot. */
  read(path: string): Promise<ReadableStream<Uint8Array> | Uint8Array | null>;

  /** For a given entrypoint, return it's list of dependencies.
   *
   * Returns an empty array if the entrypoint does not exist. */
  dependencies(path: string): string[];
}
