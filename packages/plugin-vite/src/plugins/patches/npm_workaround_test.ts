import { expect } from "@std/expect/expect";
import * as babel from "@babel/core";
import { npmWorkaround } from "./npm_workaround.ts";

function runTest(options: { input: string; expected: string }) {
  const res = babel.transformSync(options.input, {
    filename: "foo.js",
    babelrc: false,
    plugins: [npmWorkaround],
  });

  const output = res?.code ?? "";
  expect(output).toEqual(options.expected);
}

Deno.test("npm workaround - import declaration", () => {
  runTest({
    input: `import * as foo from "npm:foo";
import foo2 from "npm:foo";
import { bar } from "npm:foo";
import baz, { bar2 } from "npm:foo";`,
    expected: `import * as foo from "deno-npm:foo";
import foo2 from "deno-npm:foo";
import { bar } from "deno-npm:foo";
import baz, { bar2 } from "deno-npm:foo";`,
  });
});

Deno.test("npm workaround - export declaration", () => {
  runTest({
    input: `export * as foo from "npm:foo";
export { bar } from "npm:foo";`,
    expected: `export * as foo from "deno-npm:foo";
export { bar } from "deno-npm:foo";`,
  });
});

Deno.test("npm workaround - import()", () => {
  runTest({
    input: `import("npm:foo");
import("npm:foo", { type: "json" })`,
    expected: `import("deno-npm:foo");
import("deno-npm:foo", {
  type: "json"
});`,
  });
});
