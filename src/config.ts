import * as path from "@std/path";
import type { Mode } from "./runtime/server/mod.ts";

export interface FreshConfig {
  root: string;
  /**
   * The directory to write generated files to when `dev.ts build` is run.
   * This can be an absolute path, a file URL or a relative path.
   */
  buildOutDir: string;
  /**
   * Serve fresh from a base path instead of from the root.
   *   "/foo/bar" -> http://localhost:8000/foo/bar
   * @default {undefined}
   */
  basePath: string;
  staticDir: string;
  /**
   * Tells you in which mode Fresh is currently running in.
   */
  mode: Mode;
}

export function parseRootPath(root: string, cwd: string): string {
  if (root.startsWith("file://")) {
    root = path.fromFileUrl(root);
  } else if (!path.isAbsolute(root)) {
    root = path.join(cwd, root);
  }

  const ext = path.extname(root);
  if (
    ext === ".ts" || ext === ".tsx" || ext === ".js" || ext === ".jsx" ||
    ext === ".mjs"
  ) {
    root = path.dirname(root);
  }

  return root;
}

export function normalizeConfig(
  options: Partial<FreshConfig>,
): FreshConfig {
  const root = options.root
    ? parseRootPath(options.root, Deno.cwd())
    : Deno.cwd();

  return {
    root,
    buildOutDir: options.buildOutDir ?? path.join(root, "_fresh"),
    basePath: options.basePath ?? "",
    staticDir: options.staticDir ?? path.join(root, "static"),
    mode: "production",
  };
}

export function getSnapshotPath(config: FreshConfig): string {
  return path.join(config.buildOutDir, "snapshot.json");
}
