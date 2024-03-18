import { ResolvedFreshConfig } from "../server/types.ts";
import { colors, join } from "../server/deps.ts";
import type { BuildSnapshot, BuildSnapshotJson } from "./mod.ts";
import { setBuildId } from "../server/build_id.ts";

export class AotSnapshot implements BuildSnapshot {
  #files: Map<string, string>;
  #dependencies: Map<string, string[]>;

  constructor(
    files: Map<string, string>,
    dependencies: Map<string, string[]>,
  ) {
    this.#files = files;
    this.#dependencies = dependencies;
  }

  get paths(): string[] {
    return Array.from(this.#files.keys());
  }

  async read(path: string): Promise<ReadableStream<Uint8Array> | null> {
    const filePath = this.#files.get(path);
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
    return this.#dependencies.get(path) ?? [];
  }
}

export async function loadAotSnapshot(
  config: ResolvedFreshConfig,
): Promise<AotSnapshot | null> {
  const snapshotDirPath = config.build.outDir;
  try {
    if ((await Deno.stat(snapshotDirPath)).isDirectory) {
      console.log(
        `Using snapshot found at ${colors.cyan(snapshotDirPath)}`,
      );

      const snapshotPath = join(snapshotDirPath, "snapshot.json");
      const json = JSON.parse(
        await Deno.readTextFile(snapshotPath),
      ) as BuildSnapshotJson;
      setBuildId(json.build_id);

      const dependencies = new Map<string, string[]>(
        Object.entries(json.files),
      );

      const files = new Map<string, string>();
      Object.keys(json.files).forEach((name) => {
        const filePath = join(snapshotDirPath, name);
        files.set(name, filePath);
      });

      return new AotSnapshot(files, dependencies);
    }
    return null;
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
    return null;
  }
}
