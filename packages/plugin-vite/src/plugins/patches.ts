import type { Plugin } from "vite";
import * as babel from "@babel/core";
import { npmWorkaround } from "./patches/npm_workaround.ts";
import { cjsPlugin } from "./patches/commonjs.ts";
import { jsxComments } from "./patches/jsx_comment.ts";
import babelReact from "@babel/preset-react";

export function patches(): Plugin {
  let isDev = false;

  return {
    name: "fresh:patches",
    config(_, env) {
      isDev = env.command === "serve";
    },
    applyToEnvironment() {
      return true;
    },
    transform(code, id, options) {
      if (code.includes("__commonJS")) return;

      const presets = [];
      if (!options?.ssr) {
        presets.push([babelReact, {
          runtime: "automatic",
          importSource: "preact",
          development: isDev,
        }]);
      }

      const res = babel.transformSync(code, {
        filename: id,
        babelrc: false,
        plugins: [npmWorkaround, cjsPlugin, jsxComments],
        presets,
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
