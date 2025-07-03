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

/**
 * Converts a file path to a valid JS export name.
 *
 * @example
 * ```ts
 * pathToExportName("/islands/foo.tsx");     // "foo"
 * pathToExportName("/islands/foo.v2.tsx");  // "foo_v2"
 * pathToExportName("/islands/nav-bar.tsx"); // "nav_bar"
 * pathToExportName("/islands/_.$bar.tsx");  // "_$bar"
 * pathToExportName("/islands/1.hello.tsx"); // "_hello"
 * pathToExportName("/islands/collapse...repeat_-dash.tsx");
 * // "collapse_repeat_dash"
 * ```
 */
export function pathToExportName(filePath: string): string {
  const name = path.basename(filePath, path.extname(filePath));
  // Regex for valid JS identifier characters
  const regex = /^[^a-z_$]|[^a-z0-9_$]/gi;
  return name.replaceAll(regex, "_").replaceAll(/_{2,}/g, "_");
}

const SCRIPT_ESCAPE = /<\/(style|script)/gi;
const COMMENT_ESCAPE = /<!--/gi;

// See https://html.spec.whatwg.org/multipage/scripting.html#restrictions-for-contents-of-script-elements
export function escapeScript(
  content: string,
  options: { json?: boolean } = {},
): string {
  return content
    .replaceAll(SCRIPT_ESCAPE, "<\\/$1")
    .replaceAll(COMMENT_ESCAPE, options.json ? "\\u003C!--" : "\\x3C!--");
}
