import type { BuildSnapshot } from "./mod.ts";

export class AotSnapshot implements BuildSnapshot {
  readonly paths: string[] = [];
  constructor(
    private files: Map<string, string>,
    private _dependencies: Map<string, string[]>,
  ) {}

  async read(path: string): Promise<ReadableStream<Uint8Array> | null> {
    const filePath = this.files.get(path);
    if (filePath !== undefined) {
      try {
        const file = await Deno.open(filePath, { read: true });
        return file.readable;
      } catch (_err) {
        return null;
      }
    }

    // Handler will turn this into a 404
    return null;
  }

  dependencies(path: string): string[] {
    return this._dependencies.get(path) ?? [];
  }
}
