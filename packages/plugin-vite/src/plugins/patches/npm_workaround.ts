import type { types } from "@babel/core";

// Workaround until upstream PR is merged and released,
// see: https://github.com/vitejs/vite/pull/20558
export function npmWorkaround(
  { types: t }: { types: typeof types },
): babel.PluginObj {
  return {
    name: "fresh-npm-workaround",
    visitor: {
      ImportDeclaration(path) {
        const source = path.node.source;
        if (source.value.startsWith("npm:")) {
          source.value = `deno-${source.value}`;
        }
      },
      ExportNamedDeclaration(path) {
        const source = path.node.source;
        if (source === null || source === undefined) return;

        if (source.value.startsWith("npm:")) {
          source.value = `deno-${source.value}`;
        }
      },
      CallExpression(path) {
        if (!t.isImport(path.node.callee)) return;
        if (path.node.arguments.length < 1) return;

        const source = path.node.arguments[0];
        if (t.isStringLiteral(source)) {
          if (source.value.startsWith("npm:")) {
            source.value = `deno-${source.value}`;
            return;
          }
        }
      },
    },
  };
}
