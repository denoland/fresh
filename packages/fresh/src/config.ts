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
  /**
   * When enabled, Fresh will respect `X-Forwarded-Proto` and
   * `X-Forwarded-Host` headers to construct `ctx.url`. Enable
   * this when running behind a reverse proxy.
   *
   * Only enable `trustProxy` when your app is actually behind a trusted
   * reverse proxy. Untrusted clients could otherwise spoof these headers.
   * @default false
   */
  trustProxy?: boolean;
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
  /**
   * When enabled, Fresh will respect `X-Forwarded-Proto` and
   * `X-Forwarded-Host` headers to construct `ctx.url`. Enable
   * this when running behind a reverse proxy.
   *
   * Only enable `trustProxy` when your app is actually behind a trusted
   * reverse proxy. Untrusted clients could otherwise spoof these headers.
   */
  trustProxy: boolean;
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
