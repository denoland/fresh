import type { Plugin } from "vite";
import * as babel from "@babel/core";
import { cjsPlugin } from "./patches/commonjs.ts";
import { jsxComments } from "./patches/jsx_comment.ts";
import { inlineEnvVarsPlugin } from "./patches/inline_env_vars.ts";
import { removePolyfills } from "./patches/remove_polyfills.ts";
import { JS_REG, JSX_REG } from "../utils.ts";
import { codeEvalPlugin } from "./patches/code_eval.ts";

// @ts-ignore Workaround for https://github.com/denoland/deno/issues/30850
const { default: babelReact } = await import("@babel/preset-react");

export function patches(): Plugin {
  let isDev = false;

  return {
    name: "fresh:patches",
    sharedDuringBuild: true,
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
            throwIfNamespace: false,
          }]);
        }

        const env = isDev ? "development" : "production";

        const plugins: babel.PluginItem[] = [
          codeEvalPlugin(options?.ssr ? "ssr" : "client", env),
          // cjsPlugin,
          removePolyfills,
          jsxComments,
          inlineEnvVarsPlugin(env, Deno.env.toObject()),
        ];

        const res = babel.transformSync(code, {
          filename: id,
          sourceMaps: "both",
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
