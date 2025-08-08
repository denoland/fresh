import type { Plugin } from "vite";
import * as babel from "@babel/core";
import { npmWorkaround } from "./patches/npm_workaround.ts";
import { cjsPlugin } from "./patches/commonjs.ts";
import { jsxComments } from "./patches/jsx_comment.ts";

export function patches(): Plugin {
  return {
    name: "fresh:patches",
    applyToEnvironment() {
      return true;
    },
    transform(code, id) {
      const res = babel.transformSync(code, {
        filename: id,
        babelrc: false,
        plugins: [npmWorkaround, cjsPlugin, jsxComments],
      });

      if (res?.code) {
        return {
          code: res.code,
          map: res.map,
        };
      }
    },
  };
}
