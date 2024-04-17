import type { BuildCache, StaticFile } from "../build_cache.ts";
import * as path from "@std/path";
import type { ResolvedFreshConfig } from "../config.ts";
import type { BuildSnapshot } from "../build_cache.ts";
import { encodeHex } from "@std/encoding/hex";
import { crypto } from "@std/crypto";
import { fsAdapter } from "../fs.ts";
import type { LazyProcessor } from "./file_transformer.ts";
import { BUILD_ID } from "../runtime/build_id.ts";

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

  addLazyProcessedFile(pathname: string, lazy: LazyProcessor): Promise<void>;

  flush(): Promise<void>;
}

export class MemoryBuildCache implements DevBuildCache {
  islands = new Map<string, string>();
  #processedFiles = new Map<string, MemoryFile>();
  #unprocessedFiles = new Map<string, string>();
  #lazyPendingFiles = new Map<string, LazyProcessor>();
  #lazyPending = new Map<
    string,
    Promise<{ content: string | Uint8Array; map?: string | Uint8Array }>
  >();
  #ready = Promise.withResolvers<void>();

  constructor(
    public config: ResolvedFreshConfig,
    public buildId: string,
  ) {}

  async readFile(pathname: string): Promise<StaticFile | null> {
    await this.#ready.promise;
    const processed = this.#processedFiles.get(pathname);
    if (processed !== undefined) {
      return {
        hash: processed.hash,
        readable: processed.content,
        size: processed.content.byteLength,
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
        };
      } catch (_err) {
        return null;
      }
    }

    const p = this.#lazyPending.get(pathname);
    if (p !== undefined) {
      await p;

      const file = this.#processedFiles.get(pathname)!;

      return {
        hash: null,
        readable: file.content,
        size: file.content.byteLength,
      };
    }

    const lazy = this.#lazyPendingFiles.get(pathname);
    if (lazy !== undefined) {
      const p = lazy();
      this.#lazyPending.set(pathname, p);
      const res = await p;

      const content = typeof res.content === "string"
        ? new TextEncoder().encode(res.content)
        : res.content;

      this.#processedFiles.set(pathname, {
        content,
        hash: null,
      });

      if (res.map !== undefined) {
        const map = typeof res.map === "string"
          ? new TextEncoder().encode(res.map)
          : res.map;
        this.#processedFiles.set(pathname + ".map", {
          content: map,
          hash: null,
        });
      }

      return {
        hash: null,
        readable: content,
        size: content.byteLength,
      };
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
  async addLazyProcessedFile(
    pathname: string,
    lazy: LazyProcessor,
  ): Promise<void> {
    this.#lazyPendingFiles.set(pathname, lazy);
  }

  // deno-lint-ignore require-await
  async flush(): Promise<void> {
    this.#ready.resolve();
  }
}

// await fsAdapter.mkdirp(staticOutDir);
export class DiskBuildCache implements DevBuildCache {
  islands = new Map<string, string>();
  #processedFiles = new Map<string, string | null>();
  #unprocessedFiles = new Map<string, string>();

  constructor(public config: ResolvedFreshConfig, public buildId: string) {}

  getIslandChunkName(islandName: string): string | null {
    return this.islands.get(islandName) ?? null;
  }

  addUnprocessedFile(pathname: string): void {
    this.#unprocessedFiles.set(
      pathname,
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
    if (path.relative(outDir, filePath).startsWith(".")) {
      throw new Error(`Path "${filePath}" resolved outside of "${outDir}"`);
    }

    await fsAdapter.mkdirp(path.dirname(filePath));
    await Deno.writeFile(filePath, content);
  }

  async addLazyProcessedFile(
    pathname: string,
    lazy: LazyProcessor,
  ): Promise<void> {
    const file = await lazy();
    const buf = typeof file.content === "string"
      ? new TextEncoder().encode(file.content)
      : file.content;
    this.addProcessedFile(pathname, buf, null);
  }

  // deno-lint-ignore require-await
  async readFile(_pathname: string): Promise<StaticFile | null> {
    throw new Error("Not implemented in build mode");
  }

  async flush(): Promise<void> {
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
      path.join(this.config.build.outDir, "snapshot.json"),
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
