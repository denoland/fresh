import { expect } from "@std/expect";
import { matchPkgExport, type PkgExport } from "./deno.ts";

Deno.test("matchPkgExport", () => {
  const json: PkgExport = {
    ".": {
      module: { types: "./modules/index.d.ts", default: "./tslib.es6.mjs" },
      import: {
        node: "./modules/index.js",
        default: { types: "./modules/index.d.ts", default: "./foo.js" },
      },
      default: "./tslib.js",
    },
    "./*": "./*",
    "./": "./",
  };
  expect(matchPkgExport("foo", "foo.js", json)).toEqual("foo");
});
