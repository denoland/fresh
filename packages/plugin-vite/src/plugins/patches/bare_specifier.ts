import type { PluginObj, types } from "@babel/core";
import { isBuiltin } from "node:module";

export interface SpecMeta {
  default: string | null;
  namespace: string | null;
  specifiers: Array<{ local: string; imported: string }>;
}

export function bareSpecifier(
  { types: t }: { types: typeof types },
): PluginObj {
  return {
    name: "fresh-bare-specifier",
    visitor: {
      ImportDeclaration(path) {
        const src = path.node.source.value;

        if (canRewriteSrc(src)) {
          path.node.source.value = `\0deno-resolve::${src}`;
        }
      },
      CallExpression(path) {
        if (
          (t.isImport(path.node.callee) ||
            t.isIdentifier(path.node.callee) &&
              path.node.callee.name === "require") &&
          path.node.arguments.length > 0 &&
          t.isStringLiteral(path.node.arguments[0])
        ) {
          const src = path.node.arguments[0].value;

          if (canRewriteSrc(src)) {
            path.node.arguments[0].value = `\0deno-resolve::${src}`;
          }
        }
      },
    },
  };
}

function canRewriteSrc(src: string): boolean {
  return !src.startsWith(".") && !src.startsWith("@vite") &&
    !src.startsWith("http:") && !src.startsWith("https://") &&
    !src.startsWith("jsr:") && !src.startsWith("node:") && !isBuiltin(src);
}
