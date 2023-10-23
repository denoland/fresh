import { setBuildId } from "../server/build_id.ts";
import { colors, join } from "../server/deps.ts";
import type { AssetSnapshot, SnapshotFileInfo } from "./types.ts";

export class AotSnapshot implements AssetSnapshot {
  #files: Map<string, string>;
  #dependencies: Map<string, string[]>;
  #etags: Map<string, string>;

  constructor(
    files: Map<string, string>,
    dependencies: Map<string, string[]>,
    etags: Map<string, string>,
  ) {
    this.#files = files;
    this.#dependencies = dependencies;
    this.#etags = etags;
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

  getDependencies(path: string): string[] {
    return this.#dependencies.get(path) ?? [];
  }

  async getFileInfo(path: string): Promise<SnapshotFileInfo | null> {
    const stat = await Deno.stat(path);
    return { size: stat.size, etag: this.#etags.get(path)! };
  }
}

export interface BuildSnapshotJson {
  build_id: string;
  files: Record<string, { etag: string; dependencies: string[] }>;
  version?: number;
}

export async function loadAotSnapshot(outDir: string) {
  try {
    if ((await Deno.stat(outDir)).isDirectory) {
      console.log(
        `Using snapshot found at ${colors.cyan(outDir)}`,
      );

      const snapshotPath = join(outDir, "snapshot.json");
      const json = JSON.parse(
        await Deno.readTextFile(snapshotPath),
      ) as BuildSnapshotJson;
      setBuildId(json.build_id);

      if (json.version === undefined || json.version !== 2) {
        throw new Error(
          `Attempted to load an outdated snapshot. Please run "deno task build" to update the snapshot.`,
        );
      }

      const dependencies = new Map<string, string[]>();
      const etags = new Map<string, string>();

      const files = new Map<string, string>();
      const fileKeys = Object.keys(json.files);

      await Promise.all(fileKeys.map((name) => {
        const entry = json.files[name];
        dependencies.set(name, entry.dependencies);

        const filePath = join(outDir, name);
        files.set(name, filePath);
        etags.set(filePath, entry.etag);
      }));

      return new AotSnapshot(files, dependencies, etags);
    }
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }
}
