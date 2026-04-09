/** Utility for e.g. ignored files to avoid visiting any AST nodes */
export const NO_VISITOR: Deno.lint.LintVisitor = Object.freeze({});

/** Utility for inspecting the path segments of a `file://` path */
export function pathSegments(filename: string) {
  // TODO: Make this folder respect Fresh config?
  const ROUTES_DIR = "routes";
  const ISLANDS_DIR = "(_islands)";
  const segments = new Set(filename.split("/"));

  return {
    isRoute() {
      return segments.has(ROUTES_DIR);
    },
    isIsland() {
      return segments.has(ISLANDS_DIR);
    },
  };
}
