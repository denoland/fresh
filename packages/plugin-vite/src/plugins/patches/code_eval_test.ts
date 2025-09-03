import { expect } from "@std/expect/expect";
import * as babel from "@babel/core";
import { runtimePatcher } from "./code_eval.ts";

function runTest(
  options: {
    input: string;
    expected: string;
    env: "client" | "ssr";
    mode: "development" | "production";
  },
) {
  const res = babel.transformSync(options.input, {
    filename: "foo.js",
    babelrc: false,
    plugins: [runtimePatcher(options.env, options.mode)],
  });

  const output = res?.code ?? "";
  expect(output).toEqual(options.expected);
}

Deno.test("code eval - resolve runtime conditional detection", () => {
  runTest({
    env: "client",
    mode: "development",
    input:
      `if (typeof process === 'undefined' || process.type === 'renderer' || process.browser === true || process.__nwjs) {
	module.exports = require('./browser.js');
} else {
	module.exports = require('./node.js');
}`,
    expected: `module.exports = require('./browser.js');`,
  });

  runTest({
    env: "client",
    mode: "development",
    input: `if (typeof process !== 'undefined') {
	module.exports = require('./node.js');
} else {
	module.exports = require('./browser.js');
}`,
    expected: `module.exports = require('./browser.js');`,
  });

  runTest({
    env: "ssr",
    mode: "development",
    input: `if (typeof process === 'undefined') {
      module.exports = require('./browser.js');
      } else {
        module.exports = require('./node.js');
    }`,
    expected: `module.exports = require('./node.js');`,
  });

  runTest({
    env: "ssr",
    mode: "development",
    input: `if (typeof process !== 'undefined') {
	module.exports = require('./node.js');
} else {
	module.exports = require('./browser.js');
}`,
    expected: `module.exports = require('./node.js');`,
  });
});

Deno.test("code eval - resolve process.env.NODE_ENV", () => {
  runTest({
    env: "client",
    mode: "development",
    input: `if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react.production.js');
} else {
  module.exports = require('./cjs/react.development.js');
}`,
    expected: `module.exports = require('./cjs/react.development.js');`,
  });

  runTest({
    env: "client",
    mode: "production",
    input: `if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react.production.js');
} else {
  module.exports = require('./cjs/react.development.js');
}`,
    expected: `module.exports = require('./cjs/react.production.js');`,
  });
});
