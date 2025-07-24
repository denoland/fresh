import {
  type BuildCache,
  type FileSnapshot,
  IslandPreparer,
  type StaticFile,
} from "../build_cache.ts";
import * as path from "@std/path";
import { SEPARATOR as WINDOWS_SEPARATOR } from "@std/path/windows/constants";
import { encodeHex } from "@std/encoding/hex";
import { crypto } from "@std/crypto";
import { fsAdapter } from "../fs.ts";
import type { FileTransformer } from "./file_transformer.ts";
import { assertInDir, pathToSpec } from "../utils.ts";
import type { ResolvedBuildConfig } from "./builder.ts";
import { fsItemsToCommands, type FsRouteFile } from "../fs_routes.ts";
import type { Command } from "../commands.ts";
import type { ServerIslandRegistry } from "../context.ts";

export interface MemoryFile {
  hash: string | null;
  content: Uint8Array;
}

export interface IslandModChunk {
  name: string;
  server: string;
  browser: string | null;
}

export type FsRouteFileNoMod<State> = Omit<FsRouteFile<State>, "mod">;

export interface FsRoute<State> {
  id: string;
  dir: string;
  files: FsRouteFileNoMod<State>[];
}

export interface DevBuildCache<State> extends BuildCache<State> {
  islandModNameToChunk: Map<string, IslandModChunk>;
  addUnprocessedFile(pathname: string, dir: string): void;
  addProcessedFile(
    pathname: string,
    content: Uint8Array,
    hash: string | null,
  ): Promise<void>;
  flush(): Promise<void>;
  prepare(): Promise<void>;
}

export class MemoryBuildCache<State> implements DevBuildCache<State> {
  #processedFiles = new Map<string, MemoryFile>();
  #unprocessedFiles = new Map<string, string>();
  #config: ResolvedBuildConfig;
  #transformer: FileTransformer;
  islandModNameToChunk = new Map<string, IslandModChunk>();
  #fsRoutes: FsRoute<State>;
  #commands: Command<State>[] = [];
  root: string;
  islandRegistry: ServerIslandRegistry = new Map();

  constructor(
    config: ResolvedBuildConfig,
    fsRoutes: FsRoute<State>,
    transformer: FileTransformer,
  ) {
    this.#config = config;
    this.#fsRoutes = fsRoutes;
    this.#transformer = transformer;
    this.root = config.root;
  }

  getFsRoutes(): Command<State>[] {
    return this.#commands;
  }

  async readFile(pathname: string): Promise<StaticFile | null> {
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
      } catch {
        return null;
      }
    }

    let entry = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    entry = path.join(this.#config.staticDir, entry);
    const relative = path.relative(this.#config.staticDir, entry);
    if (relative.startsWith("..")) {
      throw new Error(
        `Processed file resolved outside of static dir ${entry}`,
      );
    }

    // Might be a file that we still need to process
    const transformed = await this.#transformer.process(
      entry,
      "development",
      this.#config.target,
    );

    if (transformed !== null) {
      for (let i = 0; i < transformed.length; i++) {
        const file = transformed[i];
        const relative = path.relative(this.#config.staticDir, file.path);
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
        const filePath = path.join(this.#config.staticDir, pathname);
        const relative = path.relative(this.#config.staticDir, filePath);
        if (!relative.startsWith(".") && (await Deno.stat(filePath)).isFile) {
          this.addUnprocessedFile(pathname, this.#config.staticDir);
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

  addUnprocessedFile(pathname: string, dir: string): void {
    this.#unprocessedFiles.set(
      pathname,
      path.join(dir, pathname),
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

  async flush(): Promise<void> {
    const preparer = new IslandPreparer();

    // Load islands
    await Promise.all(
      Array.from(this.islandModNameToChunk.entries()).map(
        async ([name, chunk]) => {
          const fileUrl = path.toFileUrl(chunk.server);
          const mod = await import(fileUrl.href);

          if (chunk.browser === null) {
            throw new Error(`Unexpected missing browser chunk`);
          }

          preparer.prepare(this.islandRegistry, mod, chunk.browser, name);
        },
      ),
    );
  }

  async prepare(): Promise<void> {
    // Load FS routes
    const files = await Promise.all(this.#fsRoutes.files.map(async (file) => {
      const fileUrl = path.toFileUrl(file.filePath);
      return {
        ...file,
        mod: await import(fileUrl.href),
      };
    }));
    this.#commands = fsItemsToCommands(files);
  }
}

export class DiskBuildCache<State> implements DevBuildCache<State> {
  #processedFiles = new Map<string, string | null>();
  #unprocessedFiles = new Map<string, string>();
  #transformer: FileTransformer;
  #config: ResolvedBuildConfig;
  islandModNameToChunk = new Map<string, IslandModChunk>();
  #fsRoutes: FsRoute<State>;
  root: string;
  islandRegistry: ServerIslandRegistry = new Map();

  constructor(
    config: ResolvedBuildConfig,
    fsRoutes: FsRoute<State>,
    transformer: FileTransformer,
  ) {
    this.#fsRoutes = fsRoutes;
    this.#transformer = transformer;
    this.#config = config;
    this.root = config.root;
  }

  getFsRoutes(): Command<State>[] {
    return [];
  }

  addUnprocessedFile(pathname: string, dir: string): void {
    this.#unprocessedFiles.set(
      pathname.replaceAll(WINDOWS_SEPARATOR, "/"),
      path.join(dir, pathname),
    );
  }

  async addProcessedFile(
    pathname: string,
    content: Uint8Array,
    hash: string | null,
  ) {
    this.#processedFiles.set(pathname, hash);

    const outDir = pathname === "/metafile.json"
      ? this.#config.outDir
      : path.join(this.#config.outDir, "static");
    const filePath = path.join(outDir, pathname);
    assertInDir(filePath, outDir);

    await fsAdapter.mkdirp(path.dirname(filePath));
    await Deno.writeFile(filePath, content);
  }

  // deno-lint-ignore require-await
  async readFile(_pathname: string): Promise<StaticFile | null> {
    throw new Error("Not implemented in build mode");
  }

  async prepare(): Promise<void> {
    // not needed
  }

  async flush(): Promise<void> {
    const { staticDir, outDir, target, root } = this.#config;

    if (await fsAdapter.isDirectory(staticDir)) {
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
          target,
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
          this.addUnprocessedFile(pathname, staticDir);
        }
      }
    }

    const staticFiles = new Map<string, FileSnapshot>();
    for (const [name, filePath] of this.#unprocessedFiles.entries()) {
      const file = await Deno.open(filePath);
      const hash = await hashContent(file.readable);

      staticFiles.set(name, {
        name,
        hash,
        filePath: path.relative(root, filePath),
      });
    }

    for (const [name, maybeHash] of this.#processedFiles.entries()) {
      let hash = maybeHash;

      // Ignore esbuild meta file. It's not intended for serving
      if (name === "/metafile.json") {
        continue;
      }

      const filePath = path.join(outDir, "static", name);
      if (maybeHash === null) {
        const file = await Deno.open(filePath);
        hash = await hashContent(file.readable);
      }

      staticFiles.set(name, {
        name,
        hash,
        filePath: path.relative(root, filePath),
      });
    }

    await Deno.writeTextFile(
      path.join(outDir, "static-files.json"),
      JSON.stringify(Array.from(staticFiles.values()), null, 2),
    );

    const islandSpecifiers: string[] = [];
    for (const spec of this.islandModNameToChunk.keys()) {
      islandSpecifiers.push(spec);
    }

    const editWarning =
      `// WARNING: DO NOT EDIT THIS FILE. It is autogenerated by Fresh.`;

    const islands = Array.from(this.islandModNameToChunk.values());

    await Deno.writeTextFile(
      path.join(outDir, "snapshot.js"),
      `${editWarning}

import { IslandPreparer } from "fresh/do-not-use";
import staticFileData from "./static-files.json" with { type: "json" };

// Import islands
${
        islands
          .map((item) => {
            const spec = pathToSpec(path.relative(outDir, item.server));
            return `import * as ${item.name} from "${spec}";`;
          })
          .join("\n")
      }

// Import routes
${
        this.#fsRoutes.files
          .map((item, i) => {
            const spec = pathToSpec(path.relative(outDir, item.filePath));
            return `import * as fsRoute_${i} from "${spec}"`;
          })
          .join("\n")
      }

export const version = ${JSON.stringify(this.#config.buildId)};

const prefix = \`/_fresh/js/\${version}\`;

export const islands = new Map();
const islandPreparer = new IslandPreparer();
${
        islands.map((item) => {
          // Strip prefix
          const prefix = `/_fresh/js/${this.#config.buildId}`;
          const chunkName = item.browser
            ? item.browser.slice(prefix.length)
            : item.browser;
          return `islandPreparer.prepare(islands, ${item.name}, \`\${prefix}${chunkName}\`, ${
            JSON.stringify(item.name)
          });`;
        }).join("\n")
      }

export const staticFiles = new Map();
for (let i = 0; i < staticFileData.length; i++) {
  const data = staticFileData[i];
  staticFiles.set(data.name, data);
}

export const fsRoutes = [
${
        this.#fsRoutes.files
          .map((item, i) => {
            const id = JSON.stringify(item.id);
            const pattern = JSON.stringify(item.pattern);
            const type = JSON.stringify(item.type);
            const routePattern = JSON.stringify(item.routePattern);

            return `  { id: ${id}, mod: fsRoute_${i}, type: ${type}, pattern: ${pattern}, routePattern: ${routePattern} },`;
          })
          .join("\n")
      }
];
`,
    );

    // TODO: Make main file configurable
    const appPath = path.relative(outDir, root);
    await Deno.writeTextFile(
      path.join(outDir, "server.js"),
      `${editWarning}
import { setBuildCache, ProdBuildCache, path } from "fresh/do-not-use";
import * as snapshot from "./snapshot.js";
import { app } from "${appPath}/main.ts";

const root = path.join(import.meta.dirname, ${JSON.stringify(appPath)});
setBuildCache(app, new ProdBuildCache(root, snapshot));

export default {
  fetch: app.handler()
}`,
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
