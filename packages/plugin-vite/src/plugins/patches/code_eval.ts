import type { PluginObj, types } from "@babel/core";

export function codeEvalPlugin(
  env: "ssr" | "client",
  mode: string,
) {
  return (
    { types: t }: { types: typeof types },
  ): PluginObj => {
    return {
      name: "fresh-remove-polyfills",
      visitor: {
        IfStatement: {
          enter(path) {
            const res = evaluateExpr(t, env, mode, path.node.test);
            // Could not evaluate
            if (res === null) return;
            if (res) {
              if (t.isBlockStatement(path.node.consequent)) {
                path.replaceWithMultiple(path.node.consequent.body);
              } else {
                path.replaceWith(path.node.consequent);
              }
            } else if (path.node.alternate) {
              if (t.isBlockStatement(path.node.alternate)) {
                path.replaceWithMultiple(path.node.alternate.body);
              } else {
                path.replaceWith(path.node.alternate);
              }
            } else {
              path.remove();
            }
          },
        },
      },
    };
  };
}

function evaluateExpr(
  t: typeof types,
  env: "client" | "ssr",
  mode: string,
  node: types.Node,
): boolean | null {
  if (t.isLogicalExpression(node)) {
    const left = evaluateExpr(t, env, mode, node.left);
    if (left === null) return null;
    if (left && node.operator === "||") return true;

    const right = evaluateExpr(t, env, mode, node.right);
    if (right === null) return null;

    switch (node.operator) {
      case "||":
        return left || right;
      case "&&":
        return left && right;
      case "??":
        return left ?? right;
      default:
        return false;
    }
  } else if (t.isBinaryExpression(node)) {
    // Check: typeof process == "undefined"
    // Check: typeof process === "undefined"
    // Check: typeof process != "undefined"
    // Check: typeof process !== "undefined"
    if (
      t.isUnaryExpression(node.left) && node.left.operator === "typeof" &&
      t.isIdentifier(node.left.argument) &&
      node.left.argument.name === "process" && t.isStringLiteral(node.right) &&
      node.right.value === "undefined"
    ) {
      if (node.operator === "==" || node.operator === "===") {
        return env !== "ssr";
      } else if (node.operator === "!=" || node.operator === "!==") {
        return env === "ssr";
      }
    } else if (
      // Check: process.env.NODE_ENV == "production"
      // Check: process.env.NODE_ENV === "production"
      // Check: process.env.NODE_ENV != "production"
      // Check: process.env.NODE_ENV !== "production"
      // Check: process.env.NODE_ENV == "development"
      // Check: process.env.NODE_ENV === "development"
      // Check: process.env.NODE_ENV != "development"
      // Check: process.env.NODE_ENV !== "development"
      t.isMemberExpression(node.left) &&
      t.isMemberExpression(node.left.object) &&
      t.isIdentifier(node.left.object.object) &&
      node.left.object.object.name === "process" &&
      t.isIdentifier(node.left.object.property) &&
      node.left.object.property.name === "env" &&
      t.isIdentifier(node.left.property) &&
      node.left.property.name === "NODE_ENV" &&
      t.isStringLiteral(node.right)
    ) {
      const value = node.right.value;

      switch (node.operator) {
        case "==":
          return mode == value;
        case "===":
          return mode === value;
        case "!=":
          return mode != value;
        case "!==":
          return mode !== value;
        case "+":
        case "-":
        case "/":
        case "%":
        case "*":
        case "**":
        case "&":
        case "|":
        case ">>":
        case ">>>":
        case "<<":
        case "^":
        case "in":
        case "instanceof":
        case ">":
        case "<":
        case ">=":
        case "<=":
        case "|>":
          break;
      }
    }

    return null;
  }

  return null;
}
