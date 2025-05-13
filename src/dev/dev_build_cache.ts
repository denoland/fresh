import type { BuildCache, StaticFile } from "../build_cache.ts";
import * as path from "@std/path";
import { SEPARATOR as WINDOWS_SEPARATOR } from "@std/path/windows/constants";
import { getSnapshotPath, type ResolvedFreshConfig } from "../config.ts";
import type { BuildSnapshot } from "../build_cache.ts";
import { encodeHex } from "@std/encoding/hex";
import { crypto } from "@std/crypto";
import { fsAdapter, isDirectory } from "../fs.ts";
import type { FreshFileTransformer } from "./file_transformer.ts";
import { assertInDir } from "../utils.ts";

export interface MemoryFile {
  hash: string | null;
  content: Uint8Array;
}

export interface DevBuildCache extends BuildCache {
  islands: Map<string, string>;

  addUnprocessedFile(pathname: string): void;

  addProcessedFile(
    pathname: string,
    content: Uint8Array,
    hash: string | null,
  ): Promise<void>;

  flush(): Promise<void>;
}

export class MemoryBuildCache implements DevBuildCache {
  hasSnapshot = true;
  islands = new Map<string, string>();
  #processedFiles = new Map<string, MemoryFile>();
  #unprocessedFiles = new Map<string, string>();
  #ready = Promise.withResolvers<void>();

  constructor(
    public config: ResolvedFreshConfig,
    public buildId: string,
    public transformer: FreshFileTransformer,
    public target: string | string[],
  ) {
  }

  async readFile(pathname: string): Promise<StaticFile | null> {
    await this.#ready.promise;
    const processed = this.#processedFiles.get(pathname);
    if (processed !== undefined) {
      return {
        hash: processed.hash,
        readable: processed.content,
        size: processed.content.byteLength,
        close: () => {},
      };
    }

    const unprocessed = this.#unprocessedFiles.get(pathname);
    if (unprocessed !== undefined) {
      try {
        const [stat, file] = await Promise.all([
          Deno.stat(unprocessed),
          Deno.open(unprocessed, { read: true }),
        ]);

        return {
          hash: null,
          size: stat.size,
          readable: file.readable,
          close: () => file.close(),
        };
      } catch (_err) {
        return null;
      }
    }

    let entry = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    entry = path.join(this.config.staticDir, entry);
    const relative = path.relative(this.config.staticDir, entry);
    if (relative.startsWith(".")) {
      throw new Error(
        `Processed file resolved outside of static dir ${entry}`,
      );
    }

    // Might be a file that we still need to process
    const transformed = await this.transformer.process(
      entry,
      "development",
      this.target,
    );

    if (transformed !== null) {
      for (let i = 0; i < transformed.length; i++) {
        const file = transformed[i];
        const relative = path.relative(this.config.staticDir, file.path);
        if (relative.startsWith(".")) {
          throw new Error(
            `Processed file resolved outside of static dir ${file.path}`,
          );
        }
        const pathname = `/${relative}`;

        this.addProcessedFile(pathname, file.content, null);
      }
      if (this.#processedFiles.has(pathname)) {
        return this.readFile(pathname);
      }
    } else {
      try {
        const filePath = path.join(this.config.staticDir, pathname);
        const relative = path.relative(this.config.staticDir, filePath);
        if (!relative.startsWith(".") && (await Deno.stat(filePath)).isFile) {
          this.addUnprocessedFile(pathname);
          return this.readFile(pathname);
        }
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          throw err;
        }
      }
    }

    return null;
  }

  getIslandChunkName(islandName: string): string | null {
    return this.islands.get(islandName) ?? null;
  }

  addUnprocessedFile(pathname: string): void {
    this.#unprocessedFiles.set(
      pathname,
      path.join(this.config.staticDir, pathname),
    );
  }

  // deno-lint-ignore require-await
  async addProcessedFile(
    pathname: string,
    content: Uint8Array,
    hash: string | null,
  ): Promise<void> {
    this.#processedFiles.set(pathname, { content, hash });
  }

  // deno-lint-ignore require-await
  async flush(): Promise<void> {
    this.#ready.resolve();
  }
}

// await fsAdapter.mkdirp(staticOutDir);
export class DiskBuildCache implements DevBuildCache {
  hasSnapshot = true;
  islands = new Map<string, string>();
  #processedFiles = new Map<string, string | null>();
  #unprocessedFiles = new Map<string, string>();
  #transformer: FreshFileTransformer;
  #target: string | string[];

  constructor(
    public config: ResolvedFreshConfig,
    public buildId: string,
    transformer: FreshFileTransformer,
    target: string | string[],
  ) {
    this.#transformer = transformer;
    this.#target = target;
  }

  getIslandChunkName(islandName: string): string | null {
    return this.islands.get(islandName) ?? null;
  }

  addUnprocessedFile(pathname: string): void {
    this.#unprocessedFiles.set(
      pathname.replaceAll(WINDOWS_SEPARATOR, "/"),
      path.join(this.config.staticDir, pathname),
    );
  }

  async addProcessedFile(
    pathname: string,
    content: Uint8Array,
    hash: string | null,
  ) {
    this.#processedFiles.set(pathname, hash);

    const outDir = pathname === "/metafile.json"
      ? this.config.build.outDir
      : path.join(this.config.build.outDir, "static");
    const filePath = path.join(outDir, pathname);
    assertInDir(filePath, outDir);

    await fsAdapter.mkdirp(path.dirname(filePath));
    await Deno.writeFile(filePath, content);
  }

  // deno-lint-ignore require-await
  async readFile(_pathname: string): Promise<StaticFile | null> {
    throw new Error("Not implemented in build mode");
  }

  async flush(): Promise<void> {
    const staticDir = this.config.staticDir;
    const outDir = this.config.build.outDir;

    if (await isDirectory(staticDir)) {
      const entries = fsAdapter.walk(staticDir, {
        includeDirs: false,
        includeFiles: true,
        followSymlinks: false,
        // Skip any folder or file starting with a "."
        skip: [/\/\.[^/]+(\/|$)/],
      });

      for await (const entry of entries) {
        // OutDir might be inside static dir
        if (!path.relative(outDir, entry.path).startsWith("..")) {
          continue;
        }

        const result = await this.#transformer.process(
          entry.path,
          "production",
          this.#target,
        );

        if (result !== null) {
          for (let i = 0; i < result.length; i++) {
            const file = result[i];
            assertInDir(file.path, staticDir);
            const pathname = `/${path.relative(staticDir, file.path)}`;
            await this.addProcessedFile(pathname, file.content, null);
          }
        } else {
          const relative = path.relative(staticDir, entry.path);
          const pathname = `/${relative}`;
          this.addUnprocessedFile(pathname);
        }
      }
    }

    const snapshot: BuildSnapshot = {
      version: 1,
      buildId: this.buildId,
      islands: {},
      staticFiles: {},
    };

    for (const [name, chunk] of this.islands.entries()) {
      snapshot.islands[name] = chunk;
    }

    for (const [name, filePath] of this.#unprocessedFiles.entries()) {
      const file = await Deno.open(filePath);
      const hash = await hashContent(file.readable);

      snapshot.staticFiles[name] = {
        hash,
        generated: false,
      };
    }

    for (const [name, maybeHash] of this.#processedFiles.entries()) {
      let hash = maybeHash;

      // Ignore esbuild meta file. It's not intended for serving
      if (name === "/metafile.json") {
        continue;
      }

      if (maybeHash === null) {
        const filePath = path.join(this.config.build.outDir, "static", name);
        const file = await Deno.open(filePath);
        hash = await hashContent(file.readable);
      }

      snapshot.staticFiles[name] = {
        hash,
        generated: true,
      };
    }

    await Deno.writeTextFile(
      getSnapshotPath(this.config),
      JSON.stringify(snapshot, null, 2),
    );
  }
}

async function hashContent(
  content: Uint8Array | ReadableStream<Uint8Array>,
): Promise<string> {
  const hashBuf = await crypto.subtle.digest(
    "SHA-256",
    content,
  );
  return encodeHex(hashBuf);
}
