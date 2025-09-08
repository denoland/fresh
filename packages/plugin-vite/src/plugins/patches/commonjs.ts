import type { NodePath, PluginObj, types } from "@babel/core";

export function cjsPlugin(
  { types: t }: { types: typeof types },
): PluginObj {
  const HAS_ES_MODULE = "esModule";
  const REQUIRE_CALLS = "requireCalls";
  const ROOT_SCOPE = "rootScope";
  const EXPORTED = "exported";
  const EXPORTED_NAMESPACES = "exported_namespaces";
  const ALIASED = "aliased";
  const REEXPORT = "re-export";
  const NEEDS_REQUIRE_IMPORT = "needsRequireImport";

  return {
    name: "fresh-cjs-esm",
    visitor: {
      Program: {
        enter(path, state) {
          state.set(ROOT_SCOPE, path.scope);
          state.set(EXPORTED, new Set<string>());
          state.set(EXPORTED_NAMESPACES, new Set<string>());
          state.set(REEXPORT, null);
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

          const reexport = state.get(REEXPORT);
          const exported = state.get(EXPORTED);
          const exportedNs = state.get(EXPORTED_NAMESPACES);
          const needsRequireImport = state.get(NEEDS_REQUIRE_IMPORT);

          if (needsRequireImport) {
            // Inject:
            // ```ts
            // import { createRequire } from "node:module";
            // const require = createRequire(import.meta.url);
            // ```
            const id = t.identifier("createRequire");
            path.unshiftContainer(
              "body",
              t.variableDeclaration("const", [
                t.variableDeclarator(
                  t.identifier("require"),
                  t.callExpression(t.identifier("createRequire"), [
                    t.memberExpression(
                      t.metaProperty(
                        t.identifier("import"),
                        t.identifier("meta"),
                      ),
                      t.identifier("url"),
                    ),
                  ]),
                ),
              ]),
            );
            path.unshiftContainer(
              "body",
              t.importDeclaration(
                [t.importSpecifier(id, id)],
                t.stringLiteral("node:module"),
              ),
            );
          }

          if (reexport !== null) {
            path.unshiftContainer(
              "body",
              t.exportAllDeclaration(t.cloneNode(reexport, true)),
            );
          }

          const mappedNs: string[] = [];

          for (const spec of exportedNs.values()) {
            const id = path.scope.generateUidIdentifier("__ns");
            mappedNs.push(id.name);

            path.unshiftContainer(
              "body",
              t.importDeclaration(
                [t.importNamespaceSpecifier(id)],
                t.stringLiteral(spec),
              ),
            );
          }

          if (exported.size > 0 || exportedNs.size > 0) {
            path.unshiftContainer(
              "body",
              t.expressionStatement(
                t.callExpression(
                  t.memberExpression(
                    t.identifier("Object"),
                    t.identifier("defineProperty"),
                  ),
                  [
                    t.identifier("module"),
                    t.stringLiteral("exports"),
                    t.objectExpression([
                      t.objectMethod(
                        "method",
                        t.identifier("get"),
                        [],
                        t.blockStatement([
                          t.returnStatement(t.identifier("exports")),
                        ]),
                      ),
                      t.objectMethod(
                        "method",
                        t.identifier("set"),
                        [t.identifier("value")],
                        t.blockStatement([
                          t.expressionStatement(
                            t.assignmentExpression(
                              "=",
                              t.identifier("exports"),
                              t.identifier("value"),
                            ),
                          ),
                        ]),
                      ),
                    ]),
                  ],
                ),
              ),
            );
            path.unshiftContainer(
              "body",
              t.variableDeclaration("var", [
                t.variableDeclarator(
                  t.identifier("exports"),
                  t.objectExpression([]),
                ),
                t.variableDeclarator(
                  t.identifier("module"),
                  t.objectExpression([]),
                ),
              ]),
            );
          }

          const hasEsModule = state.get(HAS_ES_MODULE);

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

          if (exportNamed.size > 0 || exportedNs.size > 0) {
            const id = path.scope.generateUidIdentifier("__default");

            path.pushContainer(
              "body",
              t.variableDeclaration("const", [
                t.variableDeclarator(
                  id,
                  t.logicalExpression(
                    "??",
                    t.memberExpression(
                      t.identifier("exports"),
                      t.identifier("default"),
                    ),
                    t.identifier("exports"),
                  ),
                ),
              ]),
            );

            if (!hasEsModule) {
              path.pushContainer(
                "body",
                t.expressionStatement(
                  t.assignmentExpression(
                    "=",
                    t.memberExpression(
                      t.cloneNode(id, true),
                      t.identifier("__esModule"),
                    ),
                    t.booleanLiteral(true),
                  ),
                ),
              );
              path.pushContainer(
                "body",
                t.expressionStatement(
                  t.assignmentExpression(
                    "=",
                    t.memberExpression(
                      t.identifier("exports"),
                      t.identifier("__esModule"),
                    ),
                    t.booleanLiteral(true),
                  ),
                ),
              );
              path.pushContainer(
                "body",
                t.exportNamedDeclaration(
                  t.variableDeclaration(
                    "const",
                    [t.variableDeclarator(
                      t.identifier("__esModule"),
                      t.booleanLiteral(true),
                    )],
                  ),
                ),
              );
            }

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

            for (let i = 0; i < mappedNs.length; i++) {
              const mapped = mappedNs[i];
              path.pushContainer(
                "body",
                t.expressionStatement(
                  t.callExpression(
                    t.memberExpression(
                      t.identifier("Object"),
                      t.identifier("assign"),
                    ),
                    [t.cloneNode(id, true), t.identifier(mapped)],
                  ),
                ),
              );
            }

            path.pushContainer("body", t.exportDefaultDeclaration(id));
            path.pushContainer(
              "body",
              t.exportNamedDeclaration(
                t.variableDeclaration("var", [
                  t.variableDeclarator(
                    t.identifier("__require"),
                    t.identifier("exports"),
                  ),
                ]),
              ),
            );
          }

          const hasAnyExports = path.get("body").some((p) =>
            t.isExportAllDeclaration(p.node) ||
            t.isExportDefaultDeclaration(p.node) ||
            t.isExportNamedDeclaration(p.node)
          );

          if (!hasAnyExports && hasEsModule) {
            path.pushContainer("body", t.exportNamedDeclaration(null));
          }
        },
      },
      CallExpression(path, state) {
        const exported = state.get(EXPORTED);

        if (isObjEsModuleFlag(t, path.node)) {
          state.set(HAS_ES_MODULE, true);
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

          if (t.isStringLiteral(path.node.arguments[0])) {
            // Check if we can hoist it or if we need to keep it.
            let canImport = true;
            let parent: NodePath | null = path.parentPath;
            while (parent !== null) {
              if (
                t.isTryStatement(parent.node) || t.isIfStatement(parent.node) ||
                t.isConditionalExpression(parent.node)
              ) {
                canImport = false;
                break;
              }
              parent = parent.parentPath;
            }

            if (!canImport) {
              state.set(NEEDS_REQUIRE_IMPORT, true);
              return;
            }

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
                    t.identifier("__require"),
                  ),
                  t.logicalExpression(
                    "??",
                    t.memberExpression(
                      t.cloneNode(id, true),
                      t.identifier("default"),
                    ),
                    t.cloneNode(id, true),
                  ),
                ),
              );
              return;
            }

            path.replaceWith(t.cloneNode(id, true));
          } else {
            state.set(NEEDS_REQUIRE_IMPORT, true);
          }
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
        enter(path, state) {
          // Check: Object.defineProperty(module.exports) "__esModule" ...)
          // Check: Object.defineProperty(exports) "__esModule" ...)
          if (
            t.isCallExpression(path.node.expression) &&
            t.isMemberExpression(path.node.expression.callee) &&
            t.isIdentifier(path.node.expression.callee.object) &&
            t.isIdentifier(path.node.expression.callee.property) &&
            path.node.expression.callee.object.name === "Object" &&
            path.node.expression.callee.property.name === "defineProperty" &&
            path.node.expression.arguments.length >= 2 &&
            t.isStringLiteral(path.node.expression.arguments[1]) &&
            path.node.expression.arguments[1].value === "__esModule"
          ) {
            state.set(HAS_ES_MODULE, true);
            return;
          }

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
            state.get(EXPORTED_NAMESPACES).add(spec.value);
            path.replaceWith(t.exportAllDeclaration(spec));
          } else if (
            t.isExpressionStatement(path.node) &&
            t.isCallExpression(path.node.expression) &&
            t.isFunctionExpression(path.node.expression.callee)
          ) {
            if (
              path.node.expression.callee.params.length > 0 &&
              t.isIdentifier(path.node.expression.callee.params[0])
            ) {
              const alias = path.node.expression.callee.params[0].name;
              state.set(ALIASED, alias);
            }
          } else if (
            // Check: Object.defineProperty(exports, "foo", { enumerable: true, get: function () { return foo; } });
            t.isCallExpression(path.node.expression) &&
            t.isMemberExpression(path.node.expression.callee) &&
            t.isIdentifier(path.node.expression.callee.object) &&
            path.node.expression.callee.object.name === "Object" &&
            t.isIdentifier(path.node.expression.callee.property) &&
            path.node.expression.callee.property.name === "defineProperty" &&
            path.node.expression.arguments.length >= 2 &&
            t.isIdentifier(path.node.expression.arguments[0]) &&
            path.node.expression.arguments[0].name === "exports" &&
            t.isStringLiteral(path.node.expression.arguments[1]) &&
            t.isObjectExpression(path.node.expression.arguments[2])
          ) {
            const exported = path.node.expression.arguments[1].value;
            const obj = path.node.expression.arguments[2];
            for (let i = 0; i < obj.properties.length; i++) {
              const prop = obj.properties[i];

              if (
                t.isObjectProperty(prop) && t.isIdentifier(prop.key) &&
                prop.key.name === "get" && t.isFunctionExpression(prop.value) &&
                t.isBlockStatement(prop.value.body) &&
                prop.value.body.body.length === 1 &&
                t.isReturnStatement(prop.value.body.body[0])
              ) {
                const expr = prop.value.body.body[0].argument;
                if (expr !== null && expr !== undefined) {
                  path.replaceWith(
                    t.assignmentExpression(
                      "=",
                      t.memberExpression(
                        t.identifier("exports"),
                        t.identifier(exported),
                      ),
                      t.cloneNode(expr, true),
                    ),
                  );
                }
              } else if (
                t.isObjectMethod(prop) && t.isIdentifier(prop.key) &&
                prop.key.name === "get" && t.isBlockStatement(prop.body) &&
                prop.body.body.length === 1 &&
                t.isReturnStatement(prop.body.body[0])
              ) {
                const expr = prop.body.body[0].argument;
                if (expr !== null && expr !== undefined) {
                  path.replaceWith(
                    t.assignmentExpression(
                      "=",
                      t.memberExpression(
                        t.identifier("exports"),
                        t.identifier(exported),
                      ),
                      t.cloneNode(expr, true),
                    ),
                  );
                }
              }
            }
          } else if (
            // Check: module.exports = require(...)
            t.isAssignmentExpression(path.node.expression) &&
            t.isMemberExpression(path.node.expression.left) &&
            t.isIdentifier(path.node.expression.left.object) &&
            t.isIdentifier(path.node.expression.left.property) &&
            path.node.expression.left.object.name === "module" &&
            path.node.expression.left.property.name === "exports" &&
            t.isCallExpression(path.node.expression.right) &&
            t.isIdentifier(path.node.expression.right.callee) &&
            path.node.expression.right.callee.name === "require" &&
            path.node.expression.right.arguments.length === 1 &&
            t.isStringLiteral(path.node.expression.right.arguments[0])
          ) {
            const source = path.node.expression.right.arguments[0];
            state.set(REEXPORT, source);
          } else {
            let depth = 0;
            let current = path.node.expression;

            while (
              t.isAssignmentExpression(current) &&
              t.isMemberExpression(current.left) &&
              t.isIdentifier(current.left.object) &&
              current.left.object.name === "exports"
            ) {
              if (
                t.isUnaryExpression(current.right) &&
                current.right.operator === "void" &&
                t.isNumericLiteral(current.right.argument) &&
                current.right.argument.value === 0
              ) {
                if (depth > 0) {
                  path.remove();
                }

                break;
              }

              depth++;
              current = current.right;
            }
          }
        },
        exit(path, state) {
          const exported = state.get(EXPORTED);
          const expr = path.get("expression");

          if (expr.isAssignmentExpression()) {
            const left = expr.get("left");

            if (isEsModuleFlag(t, expr.node)) {
              state.set(HAS_ES_MODULE, true);
              // path.remove();
            } else if (left.isMemberExpression()) {
              if (isModuleExports(t, left.node)) {
                exported.add("default");

                if (t.isObjectExpression(expr.node.right)) {
                  const properties = expr.node.right.properties;
                  for (let i = 0; i < properties.length; i++) {
                    const prop = properties[i];
                    if (t.isObjectProperty(prop)) {
                      if (t.isIdentifier(prop.key)) {
                        if (prop.key.name === "__esModule") {
                          continue;
                        }

                        exported.add(prop.key.name);
                      }
                    }
                  }
                }
              } else {
                const named = getExportsAssignName(t, left.node);
                if (named === null) return;
                exported.add(named);
              }
            }
          } else if (expr.isCallExpression()) {
            if (isObjEsModuleFlag(t, expr.node)) {
              state.set(HAS_ES_MODULE, true);
            }
          }
        },
      },
      VariableDeclaration(path) {
        if (path.node.declarations.length === 0) {
          path.remove();
        }
      },
      ConditionalExpression(path) {
        if (
          t.isBinaryExpression(path.node.test) &&
          t.isUnaryExpression(path.node.test.left) &&
          path.node.test.left.operator === "typeof" &&
          t.isIdentifier(path.node.test.left.argument) &&
          path.node.test.left.argument.name === "exports" &&
          path.node.test.operator === "==="
        ) {
          path.replaceWith(t.cloneNode(path.node.alternate, true));
        }
      },
      AssignmentExpression(path, state) {
        const exported = state.get(EXPORTED);
        const aliased = state.get(ALIASED);
        if (aliased === undefined) return;

        if (
          path.node.operator === "=" && t.isMemberExpression(path.node.left) &&
          t.isIdentifier(path.node.left.object) &&
          path.node.left.object.name === aliased &&
          t.isIdentifier(path.node.left.property)
        ) {
          const name = path.node.left.property.name;
          exported.add(name);
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
