import { expect } from "@std/expect/expect";
import * as babel from "@babel/core";
import { jsxComments } from "./jsx_comment.ts";

function runTest(options: { input: string; expected: string }) {
  const res = babel.transformSync(options.input, {
    filename: "foo.js",
    babelrc: false,
    plugins: [jsxComments],
  });

  const output = res?.code ?? "";
  expect(output).toEqual(options.expected);
}

Deno.test("jsx comments - import declaration", () => {
  runTest({
    input:
      `/** @jsxRuntime classic */ /** @jsxImportSource npm:preact@^10.27.0 */ /** @jsxImportSourceTypes npm:preact@^10.27.0 */ /** @jsxFactory React.createElement */ /** @jsxFragmentFactory React.Fragment */ foo;`,
    expected: `/**  */ /**  */ /**  */ /**  */ /**  */foo;`,
  });
});
