import type { Plugin } from "vite";
import * as babel from "@babel/core";
import { cjsPlugin } from "./patches/commonjs.ts";
import { jsxComments } from "./patches/jsx_comment.ts";
import babelReact from "@babel/preset-react";
import { inlineEnvVarsPlugin } from "./patches/inline_env_vars.ts";
import { removePolyfills } from "./patches/remove_polyfills.ts";
import { JS_REG, JSX_REG } from "../utils.ts";

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
      if (!JS_REG.test(id)) return;

      const presets = [];
      if (!options?.ssr && JSX_REG.test(id)) {
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
          removePolyfills,
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
