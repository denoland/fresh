import * as path from "@std/path";
import type { Lazy, MaybeLazy } from "./types.ts";

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

export class UniqueNamer {
  #seen = new Map<string, number>();

  getUniqueName(name: string): string {
    const count = this.#seen.get(name);
    if (count === undefined) {
      this.#seen.set(name, 1);
    } else {
      this.#seen.set(name, count + 1);
      name = `${name}_${count}`;
    }

    return name;
  }
}

const PATH_TO_SPEC = /[\\/]+/g;
export function pathToSpec(outDir: string, spec: string): string {
  if (
    spec.startsWith("http:") || spec.startsWith("https:") ||
    spec.startsWith("jsr:")
  ) {
    return spec;
  } else if (spec.startsWith("file://")) {
    spec = path.fromFileUrl(spec);
    spec = path.relative(outDir, spec);
    return maybeDot(spec);
  } else if (path.isAbsolute(spec)) {
    spec = path.relative(outDir, spec);
    spec = spec.replaceAll(PATH_TO_SPEC, "/");
    return maybeDot(spec);
  }

  spec = spec.replaceAll(PATH_TO_SPEC, "/");
  if (!spec.startsWith("/")) {
    spec = `./${spec}`;
  }
  return spec;
}

function maybeDot(spec: string): string {
  return spec.startsWith(".") ? spec : `./${spec}`;
}

export function isLazy<T>(value: MaybeLazy<T>): value is Lazy<T> {
  return typeof value === "function";
}
