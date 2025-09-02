import { expect } from "@std/expect/expect";
import * as babel from "@babel/core";
import { runtimePatcher } from "./runtime_patcher.ts";

function runTest(
  options: { input: string; expected: string; env: "client" | "ssr" },
) {
  const res = babel.transformSync(options.input, {
    filename: "foo.js",
    babelrc: false,
    plugins: [runtimePatcher(options.env)],
  });

  const output = res?.code ?? "";
  expect(output).toEqual(options.expected);
}

Deno.test("runtime patcher - resolve runtime conditional detection", () => {
  runTest({
    env: "client",
    input:
      `if (typeof process === 'undefined' || process.type === 'renderer' || process.browser === true || process.__nwjs) {
	module.exports = require('./browser.js');
} else {
	module.exports = require('./node.js');
}`,
    expected: `Object.keys({
  foo: "bar"
});`,
  });
});

Deno.test("runtime patcher - conditional runtime env detection", () => {
  runTest({
    env: "client",
    input: `if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react.production.js');
} else {
  module.exports = require('./cjs/react.development.js');
}`,
    expected: `Object.keys({
  foo: "bar"
});`,
  });
});
