import type { PluginObj, types } from "../../deno_workarounds/babel.ts";

export function jsxComments(): PluginObj {
  return {
    name: "fresh-jsx-comment",
    visitor: {
      Program(path) {
        const comments = (path.parent as types.File).comments;
        if (comments) {
          for (let i = 0; i < comments.length; i++) {
            const comment = comments[i];

            comment.value = comment.value.replaceAll(/@jsx\w+\s+[^\s*]+/g, "");
          }
        }
      },
    },
  };
}
