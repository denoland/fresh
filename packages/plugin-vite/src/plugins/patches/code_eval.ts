import type {
  PluginObj,
  PluginPass,
  types,
} from "../../deno_workarounds/babel.ts";

const APPLY_PG_QUIRKS = "applyPgQuirks";

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
          enter(path, state) {
            const res = evaluateExpr(t, env, mode, path.node.test, state);
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
  state: PluginPass,
): boolean | null {
  if (t.isLogicalExpression(node)) {
    const left = evaluateExpr(t, env, mode, node.left, state);
    if (left === null) return null;
    if (left && node.operator === "||") return true;

    const right = evaluateExpr(t, env, mode, node.right, state);
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
      // Workaround for npm:pg
      // Check: typeof process.env.NODE_PG_FORCE_NATIVE !== "undefined"
      t.isUnaryExpression(node.left) &&
      t.isMemberExpression(node.left.argument) &&
      t.isMemberExpression(node.left.argument.object) &&
      t.isIdentifier(node.left.argument.object.object) &&
      node.left.argument.object.object.name === "process" &&
      t.isIdentifier(node.left.argument.object.property) &&
      node.left.argument.object.property.name === "env" &&
      t.isIdentifier(node.left.argument.property) &&
      node.left.argument.property.name === "NODE_PG_FORCE_NATIVE" &&
      t.isStringLiteral(node.right)
    ) {
      state.set(APPLY_PG_QUIRKS, true);
      const left = typeof Deno.env.get("NODE_PG_FORCE_NATIVE");
      const right = node.right.value;

      const result = applyBinExpr(left, right, node);
      if (result !== null) return result;
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

      const result = applyBinExpr(mode, value, node);
      if (result !== null) return result;
    } else if (
      // Check: process.foo === "bar"
      env === "ssr" && t.isMemberExpression(node.left) &&
      t.isIdentifier(node.left.object) && node.left.object.name === "process" &&
      t.isIdentifier(node.left.property) &&
      !PROCESS_PROPERTIES.has(node.left.property.name)
    ) {
      return false;
    }

    return null;
  } else if (
    t.isMemberExpression(node) && t.isIdentifier(node.object) &&
    node.object.name === "process" && t.isIdentifier(node.property)
  ) {
    return PROCESS_PROPERTIES.has(node.property.name);
  } else if (t.isIdentifier(node) && node.name === "useLegacyCrypto") {
    return false;
  }

  return null;
}

function applyBinExpr(
  left: unknown,
  right: unknown,
  node: types.BinaryExpression,
): boolean | null {
  switch (node.operator) {
    case "==":
      return left == right;
    case "===":
      return left === right;
    case "!=":
      return left != right;
    case "!==":
      return left !== right;
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
  return null;
}

const PROCESS_PROPERTIES = new Set([
  "abort",
  "allowedNodeEnvironmentFlags",
  "arch",
  "argv",
  "argv0",
  "availableMemory",
  "channel",
  "chdir",
  "config",
  "connected",
  "constrainedMemory",
  "cpuUsage",
  "cwd",
  "debugPort",
  "disconnect",
  "dlopen",
  "emitWarning",
  "env",
  "execArgv",
  "execPath",
  "execve",
  "exit",
  "exitCode",
  "features",
  "finalization",
  "getActiveResourcesInfo",
  "getBuiltinModule",
  "getegid",
  "geteuid",
  "getgid",
  "getgroups",
  "getuid",
  "hasUncaughtExceptionCaptureCallback",
  "hrtime",
  "initgroups",
  "kill",
  "loadEnvFile",
  "mainModule",
  "memoryUsage",
  "nextTick",
  "noDeprecation",
  "permission",
  "pid",
  "platform",
  "ppid",
  "ref",
  "release",
  "report",
  "resourceUsage",
  "send",
  "setegid",
  "seteuid",
  "setgid",
  "setgroups",
  "setuid",
  "setSourceMapsEnabled",
  "setUncaughtExceptionCaptureCallback",
  "sourceMapsEnabled",
  "stderr",
  "stdin",
  "stdout",
  "throwDeprecation",
  "threadCpuUsage",
  "title",
  "traceDeprecation",
  "umask",
  "unref",
  "uptime",
  "version",
  "versions",
]);
