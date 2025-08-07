import * as path from "@std/path";

export interface FreshConfig {
  /**
   * Serve fresh from a base path instead of from the root.
   *   "/foo/bar" -> http://localhost:8000/foo/bar
   * @default undefined
   */
  basePath?: string;
  /**
   * The mode Fresh can run in.
   */
  mode?: "development" | "production";
}

/**
 * The final resolved Fresh configuration where fields the user didn't specify are set to the default values.
 */
export interface ResolvedFreshConfig {
  root: string;
  /**
   * Serve fresh from a base path instead of from the root.
   * "/foo/bar" -> http://localhost:8000/foo/bar
   */
  basePath: string;
  /**
   * The mode Fresh can run in.
   */
  mode: "development" | "production";
}

export function parseDirPath(
  dirPath: string,
  root: string,
): string {
  if (dirPath.startsWith("file://")) {
    dirPath = path.fromFileUrl(dirPath);
  } else if (!path.isAbsolute(dirPath)) {
    dirPath = path.join(root, dirPath);
  }

  if (Deno.build.os === "windows") {
    dirPath = dirPath.replaceAll("\\", "/");
  }

  return dirPath;
}
