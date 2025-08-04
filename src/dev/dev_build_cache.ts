import {
  type BuildCache,
  IslandPreparer,
  type StaticFile,
} from "../build_cache.ts";
import * as path from "@std/path";
import * as pathWin32 from "@std/path/windows";
import { pathToFileURL } from "node:url";
import { encodeHex } from "@std/encoding/hex";
import { fsAdapter } from "../fs.ts";
import type { FileTransformer } from "./file_transformer.ts";
import { assertInDir, pathToSpec } from "../utils.ts";
import type { ResolvedBuildConfig } from "./builder.ts";
import { fsItemsToCommands, type FsRouteFile } from "../fs_routes.ts";
import type { Command } from "../commands.ts";
import type { ServerIslandRegistry } from "../context.ts";
import { contentType as getStdContentType } from "@std/media-types/content-type";

const WINDOWS_SEPARATOR = pathWin32.SEPARATOR;

export interface MemoryFile {
  hash: string | null;
  contentType: string;
  content: Uint8Array;
}

export interface IslandModChunk {
  name: string;
  server: string;
  browser: string | null;
}

export type FsRouteFileNoMod<State> = Omit<FsRouteFile<State>, "mod"> & {
  lazy: boolean;
};

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
  clientEntry: string;
  features = { errorOverlay: false };

  constructor(
    config: ResolvedBuildConfig,
    fsRoutes: FsRoute<State>,
    transformer: FileTransformer,
  ) {
    if (config.mode === "development") {
      this.features.errorOverlay = true;
    }

    this.#config = config;
    this.#fsRoutes = fsRoutes;
    this.#transformer = transformer;
    this.root = config.root;

    this.clientEntry = getClientEntry(config.buildId);
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
        contentType: processed.contentType,
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
          contentType: getContentType(unprocessed),
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
    this.#processedFiles.set(pathname, {
      content,
      hash,
      contentType: getContentType(pathname),
    });
  }

  async flush(): Promise<void> {
    const preparer = new IslandPreparer();

    // Load islands
    await Promise.all(
      Array.from(this.islandModNameToChunk.entries()).map(
        async ([name, chunk]) => {
          const fileUrl = maybeToFileUrl(chunk.server);
          const mod = await import(fileUrl);

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
      const fileUrl = maybeToFileUrl(file.filePath);
      return {
        ...file,
        mod: file.lazy ? () => import(fileUrl) : await import(fileUrl),
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
  clientEntry: string = "";
  features = { errorOverlay: false };

  constructor(
    config: ResolvedBuildConfig,
    fsRoutes: FsRoute<State>,
    transformer: FileTransformer,
  ) {
    if (config.mode === "development") {
      this.features.errorOverlay = true;
    }
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

    const staticFiles: PendingStaticFile[] = [];
    for (const [name, filePath] of this.#unprocessedFiles.entries()) {
      staticFiles.push({ filePath, pathname: name, hash: null });
    }

    for (const [name, maybeHash] of this.#processedFiles.entries()) {
      // Ignore esbuild meta file. It's not intended for serving
      if (name === "/metafile.json") {
        continue;
      }

      const filePath = path.join(outDir, "static", name);
      staticFiles.push({ filePath, pathname: name, hash: maybeHash });
    }

    const islandSpecifiers: string[] = [];
    for (const spec of this.islandModNameToChunk.keys()) {
      islandSpecifiers.push(spec);
    }

    const islands = Array.from(this.islandModNameToChunk.values());

    await Deno.writeTextFile(
      path.join(outDir, "snapshot.js"),
      await generateSnapshotServer({
        buildId: this.#config.buildId,
        clientEntry: getClientEntry(this.#config.buildId),
        staticFiles,
        islands,
        writeSpecifier: (filePath) => {
          return pathToSpec(outDir, filePath);
        },
        fsRoutesFiles: this.#fsRoutes.files,
        outDir: root,
      }),
    );

    // TODO: Make main file configurable
    const appPath = path.relative(outDir, root);
    await Deno.writeTextFile(
      path.join(outDir, "server.js"),
      generateServerEntry({
        root: appPath,
        serverEntry: path.join(appPath, "main.ts"),
        snapshotSpecifier: "./snapshot.js",
      }),
    );
  }
}

const EDIT_WARNING =
  `// WARNING: DO NOT EDIT THIS FILE. It is autogenerated by Fresh.`;

export async function hashContent(
  content: Uint8Array | ReadableStream<Uint8Array>,
): Promise<string> {
  const buffer = await new Response(content).arrayBuffer();

  const hashBuf = await crypto.subtle.digest(
    "SHA-256",
    buffer,
  );
  return encodeHex(hashBuf);
}

export function getContentType(filePath: string): string {
  const ext = path.extname(filePath);
  return getStdContentType(ext) ?? "text/plain";
}

function maybeToFileUrl(file: string) {
  return file.startsWith("file://") ? file : pathToFileURL(file).href;
}

export interface PendingStaticFile {
  pathname: string;
  filePath: string;
  hash: string | null;
}

export async function generateSnapshotServer(
  options: {
    outDir: string;
    buildId: string;
    clientEntry: string;
    islands: IslandModChunk[];
    // deno-lint-ignore no-explicit-any
    fsRoutesFiles: FsRouteFileNoMod<any>[];
    staticFiles: PendingStaticFile[];
    writeSpecifier: (filePath: string) => string;
  },
): Promise<string> {
  const {
    islands,
    writeSpecifier,
    fsRoutesFiles,
    outDir,
  } = options;

  const islandImports = islands
    .map((item) => {
      const spec = writeSpecifier(item.server);
      return `import * as ${item.name} from "${spec}";`;
    })
    .join("\n");

  const fsRouteImports = fsRoutesFiles
    .map((item, i) => {
      if (item.lazy) return null;
      const spec = writeSpecifier(item.filePath);
      return `import * as fsRoute_${i} from "${spec}"`;
    })
    .filter(Boolean)
    .join("\n");

  const islandMarkers = islands.map((item) => {
    const browser = JSON.stringify(item.browser);
    const name = JSON.stringify(item.name);
    return `islandPreparer.prepare(islands, ${item.name}, ${browser}, ${name});`;
  }).join("\n");

  const serializedFsRoutes = fsRoutesFiles
    .map((item, i) => {
      const id = JSON.stringify(item.id);
      const pattern = JSON.stringify(item.pattern);
      const type = JSON.stringify(item.type);
      const routePattern = JSON.stringify(item.routePattern);

      let mod = "";
      if (item.lazy) {
        const spec = writeSpecifier(item.filePath);
        mod = `() => import(${JSON.stringify(spec)})`;
      } else {
        mod = `fsRoute_${i}`;
      }

      return `  { id: ${id}, mod: ${mod}, type: ${type}, pattern: ${pattern}, routePattern: ${routePattern} },`;
    })
    .join("\n");

  const staticFiles = await Promise.all(
    options.staticFiles.map(async (item) => {
      const file = await Deno.open(item.filePath);
      const hash = item.hash ? item.hash : await hashContent(file.readable);
      const url = new URL(item.pathname, "http://localhost");

      return {
        name: url.pathname,
        hash,
        filePath: path.isAbsolute(item.filePath)
          ? path.relative(outDir, item.filePath)
          : item.filePath,
        contentType: getContentType(item.filePath),
      };
    }),
  );

  return `${EDIT_WARNING}
import { IslandPreparer } from "fresh/internal";
${islandImports}
${fsRouteImports}

export const clientEntry = ${JSON.stringify(options.clientEntry)}
export const version = ${JSON.stringify(options.buildId)}

export const islands = new Map();
const islandPreparer = new IslandPreparer();
${islandMarkers}

export const staticFiles = new Map([
${
    staticFiles.map((def) =>
      `  [${JSON.stringify(def.name)}, ${JSON.stringify(def)}]`
    ).join(",\n")
  }
]);

export const fsRoutes = [
${serializedFsRoutes}
];
`.replaceAll(/\n[\n]+/g, "\n\n");
}

export function generateServerEntry(
  options: {
    root: string;
    serverEntry: string;
    snapshotSpecifier: string;
  },
): string {
  return `${EDIT_WARNING}
import { setBuildCache, ProdBuildCache, path } from "fresh/internal";
import * as snapshot from "${options.snapshotSpecifier}";
import { app } from "${options.serverEntry}";

const root = "";
setBuildCache(app, new ProdBuildCache(root, snapshot), "production");

export default {
  fetch: app.handler()
};
`;
}

function getClientEntry(buildId: string) {
  return `/_fresh/js/${buildId}/fresh-runtime.js`;
}
