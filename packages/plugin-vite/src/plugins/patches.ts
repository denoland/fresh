import type { Plugin } from "vite";
import * as babel from "@babel/core";
import { cjsPlugin } from "./commonjs.ts";
import { npmWorkaround } from "./npm_workaround.ts";

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
        plugins: [npmWorkaround, cjsPlugin],
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
