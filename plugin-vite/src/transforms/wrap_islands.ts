import type * as babel from "@babel/core";

export function wrapIsland(
  { types: t }: { types: typeof babel.types },
): babel.PluginObj {
  //
  const HAS_ISLANDS = "hasIlands";
  const fnName = "wrapIsland";
  const importPath = "fresh:internal";

  return {
    name: "fresh:wrap_islands",
    visitor: {
      Program: {
        exit(path, state) {
          if (!state.get(HAS_ISLANDS)) return;

          path.insertBefore(
            t.importDeclaration(
              [t.importSpecifier(t.identifier(fnName), t.identifier(fnName))],
              t.stringLiteral(importPath),
            ),
          );
        },
      },
      VariableDeclarator(path, state) {
        if (path.parentPath?.parentPath?.is("ExportNamedDeclaration")) {
          state.set(HAS_ISLANDS, true);
          // Yeah

          const init = path.get("init");
          if (init.node === null || init.node === undefined) return;

          const copy = t.cloneNode(init.node);
          const replacement = t.callExpression(
            t.identifier(fnName),
            [copy],
          );

          init.replaceWith(replacement);
        }
      },
    },
  };
}
