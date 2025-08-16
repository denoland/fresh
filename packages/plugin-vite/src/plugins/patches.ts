import type { Plugin } from "vite";
import * as babel from "@babel/core";
import { cjsPlugin } from "./patches/commonjs.ts";
import { jsxComments } from "./patches/jsx_comment.ts";
import babelReact from "@babel/preset-react";
import { inlineEnvVarsPlugin } from "./patches/inline_env_vars.ts";

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
      const presets = [];
      if (!options?.ssr && /\.(tsx?|m[jt]s)$/.test(id)) {
        presets.push([babelReact, {
          runtime: "automatic",
          importSource: "preact",
          development: isDev,
        }]);
      }

      const res = babel.transformSync(code, {
        filename: id,
        babelrc: false,
        plugins: [
          cjsPlugin,
          jsxComments,
          inlineEnvVarsPlugin(
            isDev ? "development" : "production",
          ),
        ],
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
