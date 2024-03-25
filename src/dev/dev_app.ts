import { App, FreshApp, GLOBAL_ISLANDS, ListenOptions } from "../app.ts";
import { FreshConfig } from "../config.ts";
import { fsAdapter } from "../fs.ts";
import { BuildCacheSnapshot } from "../build_cache.ts";
import * as path from "@std/path";
import { getSnapshotPath } from "../fs.ts";
import { crypto } from "@std/crypto";
import * as colors from "@std/fmt/colors";
import { encodeHex } from "@std/encoding/hex";
import { bundleJs } from "./esbuild.ts";
import * as JSONC from "@std/jsonc";
import { prettyTime } from "../utils.ts";
import { liveReload } from "./middlewares/live_reload.ts";
import { sendFile } from "../middlewares/static_files.ts";
import {
  FreshFileTransformer,
  OnTransformArgs,
  OnTransformOptions,
} from "./file_transformer.ts";
import { TransformFn } from "./file_transformer.ts";

export interface DevApp<T> extends App<T> {
  onTransformStaticFile(
    options: OnTransformOptions,
    callback: TransformFn,
  ): void;
}

export class FreshDevApp<T> extends FreshApp<T> {
  #transformer = new FreshFileTransformer();

  constructor(config: FreshConfig = {}) {
    super(config);

    this.use(liveReload());

    // Browser dev client
    this.get("/_frsh/fresh-dev-client.js", async (ctx) => {
      const outDir = this.config.build.outDir;
      const filePath = path.join(outDir, "static", "fresh-dev-client.js");
      const res = await sendFile(ctx.req, filePath, outDir, null);
      return res !== null ? res : ctx.next();
    });
  }

  onTransform(
    options: OnTransformOptions,
    callback: (args: OnTransformArgs) => void,
  ): void {
    this.#transformer.onTransform(options, callback);
  }

  async listen(options: ListenOptions = {}): Promise<void> {
    if (options.hostname === undefined) {
      options.hostname = "localhost";
    }

    if (options.port === undefined) {
      options.port = await getFreePort(8000, options.hostname);
    }

    await this.build({ dev: true });
    await super.listen(options);
    return;
  }

  async build(options: { dev?: boolean } = {}): Promise<void> {
    const start = Date.now();
    const { staticDir, build } = this.config;

    const snapshot: BuildCacheSnapshot = {
      version: 1,
      staticFiles: {},
      islands: {},
    };

    // Read static files
    if (await fsAdapter.isDirectory(staticDir)) {
      const entries = fsAdapter.walk(staticDir, {
        includeDirs: false,
        includeFiles: true,
        followSymlinks: false,
        // Skip any folder or file starting with a "."
        skip: [/\/\.[^/]+(\/|$)/],
      });

      for await (const entry of entries) {
        const result = await this.#transformer.process(entry.path);
        console.log({ result });

        const file = await Deno.open(entry.path, { read: true });

        const hashBuf = await crypto.subtle.digest(
          "SHA-256",
          file.readable,
        );
        const hash = encodeHex(hashBuf);

        const relative = path.relative(staticDir, entry.path);
        const pathname = `/${relative}`;
        snapshot.staticFiles[pathname] = { hash, generated: false };
      }
    }

    const entryPoints: Record<string, string> = {
      "fresh-runtime": "fresh-runtime",
    };
    for (const island of GLOBAL_ISLANDS.values()) {
      const filePath = island.file instanceof URL
        ? island.file.href
        : island.file;

      entryPoints[island.name] = filePath;
    }

    const denoJson = await readDenoConfig(this.config.root);

    const jsxImportSource = denoJson.config.compilerOptions?.jsxImportSource;
    if (jsxImportSource === undefined) {
      throw new Error(
        `Option compilerOptions > jsxImportSource not set in: ${denoJson.filePath}`,
      );
    }

    const staticOutDir = path.join(build.outDir, "static");
    const output = await bundleJs({
      cwd: Deno.cwd(),
      outDir: staticOutDir,
      dev: options.dev ?? false,
      target: build.target,
      entryPoints,
      jsxImportSource,
      denoJsonPath: denoJson.filePath,
    });

    await fsAdapter.mkdirp(staticOutDir);

    for (let i = 0; i < output.files.length; i++) {
      const file = output.files[i];

      const pathname = `/${file.path}`;
      snapshot.staticFiles[pathname] = { generated: true, hash: file.hash };

      const filePath = path.join(staticOutDir, file.path);
      await Deno.writeFile(filePath, file.contents);
    }

    for (const [entry, chunkName] of output.entryToChunk.entries()) {
      snapshot.islands[entry] = `/${chunkName}`;
    }

    await Deno.writeTextFile(
      getSnapshotPath(build.outDir),
      JSON.stringify(snapshot, null, 2),
    );

    const duration = Date.now() - start;
    const buildKind = options.dev ? "development" : "production";
    console.log(
      `Bundling ${buildKind} assets finished in ${
        colors.green(prettyTime(duration))
      }`,
    );
    console.log(
      `Assets written to: ${colors.cyan(build.outDir)}`,
    );
  }
}

export function getFreePort(
  startPort: number,
  hostname: string,
): number {
  // No port specified, check for a free port. Instead of picking just
  // any port we'll check if the next one is free for UX reasons.
  // That way the user only needs to increment a number when running
  // multiple apps vs having to remember completely different ports.
  let firstError;
  for (let port = startPort; port < startPort + 20; port++) {
    try {
      const listener = Deno.listen({ port, hostname });
      listener.close();
      return port;
    } catch (err) {
      if (err instanceof Deno.errors.AddrInUse) {
        // Throw first EADDRINUSE error
        // if no port is free
        if (!firstError) {
          firstError = err;
        }
        continue;
      }

      throw err;
    }
  }

  throw firstError;
}

export interface DenoConfig {
  imports?: Record<string, string>;
  importMap?: string;
  tasks?: Record<string, string>;
  lint?: {
    rules: { tags?: string[] };
    exclude?: string[];
  };
  fmt?: {
    exclude?: string[];
  };
  exclude?: string[];
  compilerOptions?: {
    jsx?: string;
    jsxImportSource?: string;
  };
}

export async function readDenoConfig(
  directory: string,
): Promise<{ config: DenoConfig; filePath: string }> {
  let dir = directory;
  while (true) {
    for (const name of ["deno.json", "deno.jsonc"]) {
      const filePath = path.join(dir, name);
      try {
        const file = await Deno.readTextFile(filePath);
        if (name.endsWith(".jsonc")) {
          return { config: JSONC.parse(file) as DenoConfig, filePath };
        } else {
          return { config: JSON.parse(file), filePath };
        }
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          throw err;
        }
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        `Could not find a deno.json file in the current directory or any parent directory.`,
      );
    }
    dir = parent;
  }
}
