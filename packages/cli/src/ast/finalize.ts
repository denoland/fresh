import type { PluginItem, types } from "@babel/core";

export function finalizeModTransform(
  { types: t }: { types: typeof types },
): PluginItem {
  return {
    name: "fresh:finalize",
    visitor: {
      Program(path) {
        path.unshiftContainer(
          "body",
          t.importDeclaration(
            [t.importSpecifier(
              t.identifier("__exportDefaultMod"),
              t.identifier("__exportDefaultMod"),
            )],
            t.stringLiteral("bundler::runtime"),
          ),
        );
      },
      ExportDefaultDeclaration(path) {
        path.replaceWith(
          t.expressionStatement(
            t.callExpression(t.identifier("__exportDefaultMod"), [
              t.arrowFunctionExpression(
                [],
                t.blockStatement([
                  t.returnStatement(
                    t.cloneNode(path.node.declaration as any, true),
                  ),
                ]),
              ),
            ]),
          ),
        );
      },
    },
  };
}
