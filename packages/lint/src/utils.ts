import { SEPARATOR_PATTERN } from "@std/path";

/** Utility for e.g. ignored files to avoid visiting any AST nodes */
export const NO_VISITOR: Deno.lint.LintVisitor = Object.freeze({});

/** Utility for inspecting the path segments of a file */
export function pathSegments(filename: string) {
  // TODO: Make this folder respect Fresh config?
  const ROUTES_DIR = "routes";
  const ISLANDS_DIR = "(_islands)";
  const segments = filename.split(SEPARATOR_PATTERN);

  return {
    isRoute() {
      return segments.includes(ROUTES_DIR);
    },
    isIsland() {
      return segments.includes(ISLANDS_DIR);
    },
  };
}
