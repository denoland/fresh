import * as path from "@std/path";

export interface FreshConfig {
  /**
   * The root directory of the Fresh project.
   *
   * Other paths, such as `build.outDir`, `staticDir`, and `fsRoutes()`
   * are resolved relative to this directory.
   * @default Deno.cwd()
   */
  root?: string;
  /**
   * The directory to write generated files to when `dev.ts build` is run.
   *
   * This can be an absolute path, a file URL or a relative path.
   * Relative paths are resolved against the `root` option.
   * @default "_fresh"
   */
  buildOutDir?: string;
  /**
   * Serve fresh from a base path instead of from the root.
   *   "/foo/bar" -> http://localhost:8000/foo/bar
   * @default undefined
   */
  basePath?: string;
  /**
   * The directory to serve static files from.
   *
   * This can be an absolute path, a file URL or a relative path.
   * Relative paths are resolved against the `root` option.
   * @default "static"
   */
  staticDir?: string;
}

/**
 * The final resolved Fresh configuration where fields the user didn't specify are set to the default values.
 */
export interface ResolvedFreshConfig extends Required<FreshConfig> {
  /**
   * The mode Fresh can run in.
   */
  mode: "development" | "production";
}

export function parseRootPath(root: string, cwd: string): string {
  return parseDirPath(root, cwd, true);
}

function parseDirPath(
  dirPath: string,
  root: string,
  fileToDir = false,
): string {
  if (dirPath.startsWith("file://")) {
    dirPath = path.fromFileUrl(dirPath);
  } else if (!path.isAbsolute(dirPath)) {
    dirPath = path.join(root, dirPath);
  }

  if (fileToDir) {
    const ext = path.extname(dirPath);
    if (
      ext === ".ts" || ext === ".tsx" || ext === ".js" || ext === ".jsx" ||
      ext === ".mjs"
    ) {
      dirPath = path.dirname(dirPath);
    }
  }

  if (Deno.build.os === "windows") {
    dirPath = dirPath.replaceAll("\\", "/");
  }

  return dirPath;
}

export function normalizeConfig(options: FreshConfig): ResolvedFreshConfig {
  const root = parseRootPath(options.root ?? ".", Deno.cwd());

  return {
    root,
    buildOutDir: parseDirPath(options.buildOutDir ?? "_fresh", root),
    basePath: options.basePath ?? "",
    staticDir: parseDirPath(options.staticDir ?? "static", root),
    mode: "production",
  };
}

export function getSnapshotPath(config: ResolvedFreshConfig): string {
  return path.join(config.buildOutDir, "snapshot.json");
}
