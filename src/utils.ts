import * as path from "@std/path";

export function assertInDir(
  filePath: string,
  dir: string,
): void {
  let tmp = filePath;
  if (!path.isAbsolute(tmp)) {
    tmp = path.join(dir, filePath);
  }

  if (path.relative(dir, tmp).startsWith(".")) {
    throw new Error(`Path "${tmp}" resolved outside of "${dir}"`);
  }
}

/**
 * Joins two path segments into a single normalized path.
 * @example
 * ```ts
 * mergePaths("/api", "users");       // "/api/users"
 * mergePaths("/api/", "/users");     // "/api/users"
 * mergePaths("/", "/users");         // "/users"
 * mergePaths("", "/users");          // "/users"
 * mergePaths("/api", "/users");      // "/api/users"
 * ```
 */
export function mergePaths(a: string, b: string) {
  if (a === "" || a === "/" || a === "/*") return b;
  if (b === "/") return a;
  if (a.endsWith("/")) return a.slice(0, -1) + b;
  if (!b.startsWith("/")) return a + "/" + b;
  return a + b;
}
