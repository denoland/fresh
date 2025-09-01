import type { PluginObj, types } from "@babel/core";

export function denoGlobal({ types: t }: { types: typeof types }): PluginObj {
  return {
    name: "fresh-deno-global",
    visitor: {
      Identifier(path) {
        if (path.node.name === "Deno") {
          // Ignore `Deno.env.get()` calls. Those will be inlined.
          if (
            t.isMemberExpression(path.parent) &&
            path.parent.object === path.node &&
            t.isIdentifier(path.parent.property) &&
            path.parent.property.name === "env" &&
            t.isMemberExpression(path.parentPath?.parent) &&
            t.isIdentifier(path.parentPath?.parent.property) &&
            path.parentPath?.parent.property.name === "get"
          ) {
            return;
          }

          throw path.buildCodeFrameError(
            `The Deno.* global cannot be used in the browser.`,
          );
        }
      },
    },
  };
}
