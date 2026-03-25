import { expect } from "@std/expect/expect";
import * as babel from "@babel/core";
import { codeEvalPlugin } from "./code_eval.ts";

function runTest(
  options: {
    input: string;
    expected: string;
    env: "client" | "server";
    mode: "development" | "production";
  },
) {
  const res = babel.transformSync(options.input, {
    filename: "foo.js",
    babelrc: false,
    plugins: [codeEvalPlugin(options.env, options.mode)],
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
    env: "server",
    mode: "development",
    input: `if (typeof process === 'undefined') {
      module.exports = require('./browser.js');
      } else {
        module.exports = require('./node.js');
    }`,
    expected: `module.exports = require('./node.js');`,
  });

  runTest({
    env: "server",
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

Deno.test("code eval - npm:debug", () => {
  runTest({
    env: "server",
    mode: "development",
    input:
      `if (typeof process === 'undefined' || process.type === 'renderer' || process.browser === true || process.__nwjs) {
	module.exports = require('./browser.js');
} else {
	module.exports = require('./node.js');
}`,
    expected: `module.exports = require('./node.js');`,
  });
});

Deno.test("code eval - npm:pg", () => {
  runTest({
    env: "server",
    mode: "development",
    input: `if (typeof process.env.NODE_PG_FORCE_NATIVE !== "undefined") {
	module.exports = require('./native.js');
} else {
	module.exports = require('./normal.js');
}`,
    expected: `module.exports = require('./normal.js');`,
  });
});

Deno.test("code eval - npm:pg #2", () => {
  runTest({
    env: "server",
    mode: "development",
    input:
      `const useLegacyCrypto = parseInt(process.versions && process.versions.node && process.versions.node.split('.')[0]) < 15
if (useLegacyCrypto) {
  // We are on an old version of Node.js that requires legacy crypto utilities.
  module.exports = require('./utils-legacy')
} else {
  module.exports = require('./utils-webcrypto')
}
`,
    expected:
      `const useLegacyCrypto = parseInt(process.versions && process.versions.node && process.versions.node.split('.')[0]) < 15;
module.exports = require('./utils-webcrypto');`,
  });
});
