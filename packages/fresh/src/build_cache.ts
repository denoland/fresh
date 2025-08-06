import * as path from "@std/path";
import type { Command } from "./commands.ts";
import { fsItemsToCommands, type FsRouteFile } from "./fs_routes.ts";
import type { ServerIslandRegistry } from "./context.ts";
import type { AnyComponent } from "preact";
import { UniqueNamer } from "./utils.ts";
import { setBuildId } from "@fresh/build-id";

export interface FileSnapshot {
  name: string;
  filePath: string;
  hash: string | null;
  contentType: string;
}

export interface BuildSnapshot<State> {
  version: string;
  clientEntry: string;
  fsRoutes: FsRouteFile<State>[];
  staticFiles: Map<string, FileSnapshot>;
  islands: ServerIslandRegistry;
}

export interface StaticFile {
  hash: string | null;
  size: number;
  contentType: string;
  readable: ReadableStream<Uint8Array> | Uint8Array;
  close(): void;
}

// deno-lint-ignore no-explicit-any
export interface BuildCache<State = any> {
  root: string;
  islandRegistry: ServerIslandRegistry;
  clientEntry: string;
  features: {
    errorOverlay: boolean;
  };
  getFsRoutes(): Command<State>[];
  readFile(pathname: string): Promise<StaticFile | null>;
}

export class ProdBuildCache<State> implements BuildCache<State> {
  #snapshot: BuildSnapshot<State>;
  islandRegistry: ServerIslandRegistry;
  clientEntry: string;
  features = { errorOverlay: false };

  constructor(public root: string, snapshot: BuildSnapshot<State>) {
    setBuildId(snapshot.version);
    this.#snapshot = snapshot;
    this.islandRegistry = snapshot.islands;
    this.clientEntry = snapshot.clientEntry;
  }

  getFsRoutes(): Command<State>[] {
    return fsItemsToCommands(this.#snapshot.fsRoutes);
  }

  async readFile(pathname: string): Promise<StaticFile | null> {
    const { staticFiles } = this.#snapshot;

    const info = staticFiles.get(pathname);
    if (info === undefined) return null;

    const filePath = path.isAbsolute(info.filePath)
      ? info.filePath
      : path.join(this.root, info.filePath);

    const [stat, file] = await Promise.all([
      Deno.stat(filePath),
      Deno.open(filePath),
    ]);

    return {
      hash: info.hash,
      contentType: info.contentType,
      size: stat.size,
      readable: file.readable,
      close: () => file.close(),
    };
  }
}

export class IslandPreparer {
  #namer = new UniqueNamer();

  prepare(
    registry: ServerIslandRegistry,
    mod: Record<string, unknown>,
    chunkName: string,
    modName: string,
  ) {
    for (const [name, value] of Object.entries(mod)) {
      if (typeof value !== "function") continue;

      const islandName = name === "default" ? modName : name;
      const uniqueName = this.#namer.getUniqueName(islandName);

      const fn = value as AnyComponent;
      registry.set(fn, {
        exportName: name,
        file: chunkName,
        fn,
        name: uniqueName,
      });
    }
  }
}
