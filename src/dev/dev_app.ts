import { FreshApp, GLOBAL_ISLANDS, ListenOptions } from "../app.ts";
import { FreshConfig } from "../config.ts";
import { fsAdapter } from "../fs.ts";
import { BuildCacheSnapshot } from "../build_cache.ts";
import * as path from "@std/path";
import { getSnapshotPath } from "../fs.ts";
import { crypto } from "@std/crypto";
import * as colors from "@std/fmt/colors";
import { encodeHex } from "@std/encoding/hex";
import { bundleJs } from "./esbuild.ts";

export class FreshDevApp<T> extends FreshApp<T> {
  constructor(config: FreshConfig = {}) {
    super(config);
  }

  async listen(options: ListenOptions = {}): Promise<void> {
    if (options.hostname === undefined) {
      options.hostname = "localhost";
    }

    if (options.port === undefined) {
      options.port = await getFreePort(8000, options.hostname);
    }

    return super.listen(options);
  }

  async build(): Promise<void> {
    const { staticDir, build } = this.config;

    const snapshot: BuildCacheSnapshot = {
      version: 1,
      staticFiles: {},
    };

    // Read static files
    if (await fsAdapter.isDirectory(staticDir)) {
      const entries = fsAdapter.walk(staticDir, {
        includeDirs: false,
        includeFiles: true,
        followSymlinks: false,
      });

      for await (const entry of entries) {
        const file = await Deno.open(entry.path, { read: true });
        const hashBuf = await crypto.subtle.digest(
          "SHA-256",
          file.readable,
        );
        const hash = encodeHex(hashBuf);

        const relative = path.relative(staticDir, entry.path);
        const pathname = `/${relative}`;
        snapshot.staticFiles[pathname] = hash;
      }
    }

    const entryPoints = new Set([
      ...Array.from(GLOBAL_ISLANDS.values()).map((entry) => {
        return entry.file instanceof URL ? entry.file.href : entry.file;
      }),
    ]);

    await bundleJs({
      cwd: ".",
      dev: false,
      target: this.config.build.target,
      entryPoints: Array.from(entryPoints),
      // FIXME: Pass jsxImportSource from config
    });

    // FIXME:
    const outDir = "<FIXME>";

    console.log(
      `Assets written to: ${colors.green(outDir)}`,
    );

    await Deno.writeTextFile(
      getSnapshotPath(build.outDir),
      JSON.stringify(snapshot),
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
