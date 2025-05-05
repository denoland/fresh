import * as path from "@std/path";

export interface FreshConfig {
  root?: string;
  build?: {
    /**
     * The directory to write generated files to when `dev.ts build` is run.
     * This can be an absolute path, a file URL or a relative path.
     */
    outDir?: string;
  };
  /**
   * Serve fresh from a base path instead of from the root.
   *   "/foo/bar" -> http://localhost:8000/foo/bar
   * @default {undefined}
   */
  basePath?: string;
  staticDir?: string;
}

/**
 * The final resolved Fresh configuration where fields the user didn't specify are set to the default values.
 */
export interface ResolvedFreshConfig {
  root: string;
  build: {
    outDir: string;
  };
  basePath: string;
  staticDir: string;
  /**
   * The mode Fresh can run in.
   */
  mode: "development" | "production";
}

export function parseRootPath(root: string, cwd: string): string {
  if (root === "\\" || root === "/") {
    return cwd;
  } else if (root.startsWith("file://")) {
    root = path.fromFileUrl(root);
  } else if (!path.isAbsolute(root)) {
    root = path.join(cwd, root);
  }

  const ext = path.extname(root);

  if (ext) {
    root = path.dirname(root);
  }

  if (root.endsWith("/") || root.endsWith("\\")) {
    root = root.slice(0, -1);
  }

  return root;
}

export function normalizeConfig(options: FreshConfig): ResolvedFreshConfig {
  const root = options.root
    ? parseRootPath(options.root, Deno.cwd())
    : Deno.cwd();

  return {
    root,
    build: {
      outDir: options.build?.outDir ?? path.join(root, "_fresh"),
    },
    basePath: options.basePath ?? "",
    staticDir: options.staticDir ?? path.join(root, "static"),
    mode: "production",
  };
}

export function getSnapshotPath(config: ResolvedFreshConfig): string {
  return path.join(config.build.outDir, "snapshot.json");
}
