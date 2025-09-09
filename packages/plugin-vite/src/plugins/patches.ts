import type { Plugin } from "vite";
import * as babel from "@babel/core";
import { cjsPlugin } from "./patches/commonjs.ts";
import { jsxComments } from "./patches/jsx_comment.ts";
import babelReact from "@babel/preset-react";
import { inlineEnvVarsPlugin } from "./patches/inline_env_vars.ts";
import { removePolyfills } from "./patches/remove_polyfills.ts";
import { JS_REG, JSX_REG } from "../utils.ts";
import { denoGlobal } from "./patches/deno_global.ts";
import { codeEvalPlugin } from "./patches/code_eval.ts";

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
    transform: {
      filter: {
        id: JS_REG,
      },
      handler(code, id, options) {
        const presets = [];
        if (!options?.ssr && JSX_REG.test(id)) {
          presets.push([babelReact, {
            runtime: "automatic",
            importSource: "preact",
            development: isDev,
          }]);
        }

        const env = isDev ? "development" : "production";

        const plugins: babel.PluginItem[] = [
          codeEvalPlugin(options?.ssr ? "ssr" : "client", env),
          cjsPlugin,
          removePolyfills,
          jsxComments,
          inlineEnvVarsPlugin(env, Deno.env.toObject()),
        ];

        if (!options?.ssr) {
          plugins.push(denoGlobal);
        }

        const res = babel.transformSync(code, {
          filename: id,
          babelrc: false,
          compact: true,
          plugins,
          presets,
        });

        if (res?.code) {
          return {
            code: res.code,
            map: res.map,
          };
        }
      },
    },
  };
}
