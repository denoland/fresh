import type { types } from "@babel/core";

export function cjsPlugin(
  { types: t }: { types: typeof types },
): babel.PluginObj {
  const HAS_ES_MODULE = "esModule";
  const REQUIRE_CALLS = "requireCalls";
  const ROOT_SCOPE = "rootScope";

  return {
    name: "fresh-cjs-esm",
    visitor: {
      Program: {
        enter(path, state) {
          state.set(ROOT_SCOPE, path.scope);
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

          if (body.length === 0 && state.get(HAS_ES_MODULE)) {
            path.pushContainer("body", t.exportNamedDeclaration(null));
          } else {
            const seen = new Set<string>();

            const children = path.get("body");
            for (let i = children.length - 1; i >= 0; i--) {
              const child = children[i];
              if (child.isExportNamedDeclaration()) {
                if (
                  t.isVariableDeclaration(child.node.declaration) &&
                  child.node.declaration.declarations.length > 0 &&
                  t.isIdentifier(child.node.declaration.declarations[0].id)
                ) {
                  const name = child.node.declaration.declarations[0].id.name;

                  if (seen.has(name)) {
                    child.remove();
                  } else {
                    seen.add(name);
                  }
                }
              }
            }
          }
        },
      },
      CallExpression(path, state) {
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
        }
      },
      ExpressionStatement(path, state) {
        const expr = path.get("expression");
        if (expr.isAssignmentExpression()) {
          const left = expr.get("left");

          if (isEsModuleFlag(t, expr.node)) {
            state.set(HAS_ES_MODULE, true);
            path.remove();
          } else if (left.isMemberExpression()) {
            if (isModuleExports(t, left.node)) {
              const right = t.cloneNode(expr.node.right, true);

              path.replaceWith(t.exportDefaultDeclaration(right));
            } else {
              const named = getExportsAssignName(t, left.node);
              if (named === null) return;

              const right = t.cloneNode(expr.node.right, true);

              if (named === "default") {
                path.replaceWith(t.exportDefaultDeclaration(right));
              } else {
                path.scope.rename(named);
                path.replaceWith(
                  t.exportNamedDeclaration(
                    t.variableDeclaration("let", [
                      t.variableDeclarator(t.identifier(named), right),
                    ]),
                  ),
                );
              }
            }
          }
        } else if (expr.isCallExpression()) {
          if (
            t.isMemberExpression(expr.node.callee) &&
            t.isIdentifier(expr.node.callee.object) &&
            expr.node.callee.object.name === "Object" &&
            t.isIdentifier(expr.node.callee.property) &&
            expr.node.callee.property.name === "defineProperty" &&
            expr.node.arguments.length === 3 &&
            t.isIdentifier(expr.node.arguments[0]) &&
            expr.node.arguments[0].name === "exports" &&
            t.isStringLiteral(expr.node.arguments[1]) &&
            expr.node.arguments[1].value !== "__esModule" &&
            t.isObjectExpression(expr.node.arguments[2])
          ) {
            const named = expr.node.arguments[1].value;
            const obj = expr.node.arguments[2];

            let right: types.Expression = t.nullLiteral();

            for (let i = 0; i < obj.properties.length; i++) {
              const prop = obj.properties[i];

              if (t.isObjectProperty(prop)) {
                if (t.isIdentifier(prop.key)) {
                  if (prop.key.name === "get") {
                    if (
                      t.isFunctionExpression(prop.value) ||
                      t.isArrowFunctionExpression(prop.value)
                    ) {
                      right = t.callExpression(
                        t.parenthesizedExpression(
                          t.cloneNode(prop.value, true),
                        ),
                        [],
                      );
                    }
                  }
                }
              } else if (t.isObjectMethod(prop)) {
                if (t.isIdentifier(prop.key)) {
                  if (prop.key.name === "get") {
                    right = t.callExpression(
                      t.parenthesizedExpression(
                        t.functionExpression(
                          null,
                          [],
                          t.cloneNode(prop.body, true),
                        ),
                      ),
                      [],
                    );
                  }
                }
              }
            }

            path.replaceWith(
              t.exportNamedDeclaration(
                t.variableDeclaration("let", [
                  t.variableDeclarator(t.identifier(named), right),
                ]),
              ),
            );
          }
        }
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
