import type { Plugin } from "vite";
import * as babel from "@babel/core";
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
        plugins: [npmWorkaround],
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
