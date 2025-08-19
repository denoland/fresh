import type { PluginObj, types } from "@babel/core";

export function cjsPlugin(
  { types: t }: { types: typeof types },
): PluginObj {
  const HAS_ES_MODULE = "esModule";
  const REQUIRE_CALLS = "requireCalls";
  const ROOT_SCOPE = "rootScope";
  const EXPORTED = "exported";

  return {
    name: "fresh-cjs-esm",
    visitor: {
      Program: {
        enter(path, state) {
          state.set(ROOT_SCOPE, path.scope);
          state.set(EXPORTED, new Set<string>());
        },
        exit(path, state) {
          const body = path.get("body");
          const requires = state.get(REQUIRE_CALLS);
          if (requires !== undefined) {
            for (let i = 0; i < requires.length; i++) {
              const { specifier, id } = requires[i];
              path.unshiftContainer(
                "body",
                t.importDeclaration(
                  [t.importNamespaceSpecifier(id)],
                  specifier,
                ),
              );
            }
          }

          const exported = state.get(EXPORTED);
          if (exported.size > 0) {
            path.unshiftContainer(
              "body",
              t.variableDeclaration("var", [
                t.variableDeclarator(
                  t.identifier("exports"),
                  t.objectExpression([]),
                ),
                t.variableDeclarator(
                  t.identifier("module"),
                  t.objectExpression([
                    t.objectProperty(
                      t.identifier("exports"),
                      t.identifier("exports"),
                      false,
                      true,
                    ),
                  ]),
                ),
              ]),
            );
          }

          const exportNamed = new Map<string, string>();

          const idExports: types.ExportSpecifier[] = [];
          for (const name of exported) {
            if (name === "default") {
              exportNamed.set(name, name);
              continue;
            }

            const id = path.scope.generateUidIdentifier(name);

            exportNamed.set(id.name, name);

            path.pushContainer(
              "body",
              t.variableDeclaration(
                "var",
                [t.variableDeclarator(
                  id,
                  t.memberExpression(
                    t.identifier("exports"),
                    t.identifier(name),
                  ),
                )],
              ),
            );
            idExports.push(
              t.exportSpecifier(id, t.identifier(name)),
            );
          }

          if (idExports.length > 0) {
            path.pushContainer(
              "body",
              t.exportNamedDeclaration(null, idExports),
            );
          }

          if (exportNamed.size > 0) {
            const id = path.scope.generateUidIdentifier("__default");

            path.pushContainer(
              "body",
              t.variableDeclaration("const", [
                t.variableDeclarator(
                  id,
                  t.logicalExpression(
                    "??",
                    t.logicalExpression(
                      "??",
                      t.memberExpression(
                        t.memberExpression(
                          t.identifier("module"),
                          t.identifier("exports"),
                        ),
                        t.identifier("default"),
                      ),
                      t.memberExpression(
                        t.identifier("exports"),
                        t.identifier("default"),
                      ),
                    ),
                    t.memberExpression(
                      t.identifier("module"),
                      t.identifier("exports"),
                    ),
                  ),
                ),
              ]),
            );

            for (const [local, exported] of exportNamed.entries()) {
              if (exported === "default") continue;

              path.pushContainer(
                "body",
                t.expressionStatement(
                  t.assignmentExpression(
                    "=",
                    t.memberExpression(id, t.identifier(exported)),
                    t.identifier(local),
                  ),
                ),
              );
            }

            path.pushContainer("body", t.exportDefaultDeclaration(id));
          }

          if (body.length === 0 && state.get(HAS_ES_MODULE)) {
            path.pushContainer("body", t.exportNamedDeclaration(null));
          }
        },
      },
      CallExpression(path, state) {
        const exported = state.get(EXPORTED);

        if (isObjEsModuleFlag(t, path.node)) {
          state.set(HAS_ES_MODULE, true);
          path.remove();
          return;
        }
        if (
          t.isIdentifier(path.node.callee) &&
          path.node.callee.name === "require"
        ) {
          const root = state.get(ROOT_SCOPE);
          const id = root.generateUidIdentifier("mod");

          const mods = state.get(REQUIRE_CALLS) ?? [];
          state.set(REQUIRE_CALLS, mods);

          mods.push({
            id,
            specifier: t.cloneNode(path.node.arguments[0], true),
          });

          if (
            path.parentPath?.isVariableDeclarator() &&
              path.parentPath?.get("id").isIdentifier() ||
            path.parentPath?.isCallExpression()
          ) {
            path.replaceWith(
              t.logicalExpression(
                "??",
                t.memberExpression(
                  t.cloneNode(id, true),
                  t.identifier("default"),
                ),
                t.cloneNode(id, true),
              ),
            );
            return;
          }

          path.replaceWith(t.cloneNode(id, true));
        } else if (
          t.isMemberExpression(path.node.callee) &&
          t.isIdentifier(path.node.callee.object) &&
          path.node.callee.object.name === "Object" &&
          t.isIdentifier(path.node.callee.property) &&
          path.node.callee.property.name === "defineProperty" &&
          path.node.arguments.length > 0 &&
          t.isIdentifier(path.node.arguments[0]) &&
          path.node.arguments[0].name === "exports" &&
          t.isStringLiteral(path.node.arguments[1])
        ) {
          const name = path.node.arguments[1].value;
          exported.add(name);
        }
      },
      EmptyStatement(path) {
        path.remove();
      },
      MemberExpression: {
        exit(path, state) {
          if (
            t.isIdentifier(path.node.object) &&
            path.node.object.name === "exports" &&
            t.isIdentifier(path.node.property)
          ) {
            const name = t.cloneNode(path.node.property);

            if (name.name === "__esModule") return;

            state.get(EXPORTED).add(name.name);
          }
        },
      },
      ExpressionStatement: {
        enter(path) {
          if (
            t.isExpressionStatement(path.node) &&
            t.isCallExpression(path.node.expression) &&
            t.isIdentifier(path.node.expression.callee) &&
            path.node.expression.callee.name === "__exportStar" &&
            path.node.expression.arguments.length > 0 &&
            t.isCallExpression(path.node.expression.arguments[0]) &&
            t.isIdentifier(path.node.expression.arguments[0].callee) &&
            path.node.expression.arguments[0].callee.name === "require" &&
            t.isStringLiteral(path.node.expression.arguments[0].arguments[0])
          ) {
            const spec = t.cloneNode(
              path.node.expression.arguments[0].arguments[0],
              true,
            );
            path.replaceWith(t.exportAllDeclaration(spec));
          }
        },
        exit(path, state) {
          const exported = state.get(EXPORTED);
          const expr = path.get("expression");

          if (expr.isAssignmentExpression()) {
            const left = expr.get("left");

            if (isEsModuleFlag(t, expr.node)) {
              state.set(HAS_ES_MODULE, true);
              path.remove();
            } else if (left.isMemberExpression()) {
              if (isModuleExports(t, left.node)) {
                exported.add("default");
              } else {
                const named = getExportsAssignName(t, left.node);
                if (named === null) return;
                exported.add(named);
              }
            }
          } else if (expr.isCallExpression()) {
            if (isObjEsModuleFlag(t, expr.node)) {
              state.set(HAS_ES_MODULE, true);
              path.remove();
            }
          }
        },
      },
    },
  };
}

function isModuleExports(
  t: typeof types,
  node: types.MemberExpression,
): boolean {
  return t.isIdentifier(node.object) && node.object.name === "module" &&
    t.isIdentifier(node.property) && node.property.name === "exports";
}

function getExportsAssignName(
  t: typeof types,
  node: types.MemberExpression,
): string | null {
  if (
    (t.isMemberExpression(node.object) &&
        isModuleExports(t, node.object) ||
      t.isIdentifier(node.object) && node.object.name === "exports") &&
    t.isIdentifier(node.property)
  ) {
    return node.property.name;
  }

  return null;
}

/**
 * Detect `exports.__esModule = true;`
 */
function isEsModuleFlag(
  t: typeof types,
  node: types.AssignmentExpression,
): boolean {
  if (!t.isMemberExpression(node.left)) return false;

  const { left, right } = node;
  return (t.isMemberExpression(left.object) &&
      isModuleExports(t, left.object) ||
    t.isIdentifier(left.object) && left.object.name === "exports") &&
    t.isIdentifier(left.property) && left.property.name === "__esModule" &&
    t.isBooleanLiteral(right);
}

/**
 * Check for `Object.defineProperty(exports, '__esModule', { value: true })`
 */
function isObjEsModuleFlag(
  t: typeof types,
  node: types.CallExpression,
): boolean {
  return t.isMemberExpression(node.callee) &&
    t.isIdentifier(node.callee.object) &&
    node.callee.object.name === "Object" &&
    t.isIdentifier(node.callee.property) &&
    node.callee.property.name === "defineProperty" &&
    node.arguments.length === 3 &&
    (t.isMemberExpression(node.arguments[0]) &&
        isModuleExports(t, node.arguments[0]) ||
      t.isIdentifier(node.arguments[0]) &&
        node.arguments[0].name === "exports") &&
    t.isStringLiteral(node.arguments[1]) &&
    node.arguments[1].value === "__esModule" &&
    t.isObjectExpression(node.arguments[2]);
}
