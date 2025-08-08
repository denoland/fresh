import { expect } from "@std/expect/expect";
import * as babel from "@babel/core";
import { cjsPlugin } from "./commonjs.ts";

function runTest(options: { input: string; expected: string }) {
  const res = babel.transformSync(options.input, {
    filename: "foo.js",
    babelrc: false,
    plugins: [cjsPlugin],
  });

  const output = res?.code ?? "";
  expect(output).toEqual(options.expected);
}

Deno.test("commonjs - module.exports default", () => {
  runTest({
    input: `module.exports = async function () {};`,
    expected: "export default (async function () {});",
  });
});

Deno.test("commonjs - module.exports default primitive", () => {
  runTest({
    input: `module.exports = 42;`,
    expected: "export default 42;",
  });
});

Deno.test("commonjs - exports with default + named", () => {
  runTest({
    input: `exports.__esModule = true;
exports.default = 'x';
exports.foo = 'foo';`,
    expected: `export default 'x';
export let foo = 'foo';`,
  });
});

Deno.test("commonjs - module.exports with default + named", () => {
  runTest({
    input: `module.exports.__esModule = true;
module.exports.default = 'x';
module.exports.foo = 'foo';`,
    expected: `export default 'x';
export let foo = 'foo';`,
  });
});

Deno.test("commonjs - Object es module flag with named clash", () => {
  runTest({
    input: `Object.defineProperty(exports, '__esModule', { value: true });
exports.foo = 'bar';
const foo = 'also bar';
`,
    expected: `export let foo = 'bar';
const _foo = 'also bar';`,
  });
});

Deno.test("commonjs - Object es module flag with named + default", () => {
  runTest({
    input: `Object.defineProperty(exports, '__esModule', { value: true });
exports.default = 'foo';
exports.foo = 'bar';
`,
    expected: `export default 'foo';
export let foo = 'bar';`,
  });
});

Deno.test("commonjs - esModule flag only", () => {
  runTest({
    input: `Object.defineProperty(exports, "__esModule", { value: true });`,
    expected: `export {};`,
  });
});

Deno.test("commonjs - esModule flag only #2", () => {
  runTest({
    input:
      `Object.defineProperty(module.exports, "__esModule", { value: true });`,
    expected: `export {};`,
  });
});

Deno.test("commonjs - esModule flag only minified #3", () => {
  runTest({
    input: `Object.defineProperty(exports, '__esModule', { value: !0 });`,
    expected: `export {};`,
  });
});

Deno.test("commonjs - exports only named", () => {
  runTest({
    input: `Object.defineProperty(exports, '__esModule', { value: true });
exports.foo = 'bar';
exports.bar = 'foo';
`,
    expected: `export let foo = 'bar';
export let bar = 'foo';`,
  });
});

Deno.test("commonjs - require", () => {
  runTest({
    input: `var foo = require("tape");
console.log(foo);
`,
    expected: `import * as _mod from "tape";
var foo = _mod.default ?? _mod;
console.log(foo);`,
  });
});

Deno.test("commonjs - require destructure", () => {
  runTest({
    input: `var { foo } = require("tape");
console.log(foo);
`,
    expected: `import * as _mod from "tape";
var {
  foo
} = _mod;
console.log(foo);`,
  });
});

Deno.test("commonjs - require assign", () => {
  runTest({
    input: `foo = require("tape");
console.log(foo);
`,
    expected: `import * as _mod from "tape";
foo = _mod;
console.log(foo);`,
  });
});

Deno.test("commonjs - require assign pattern", () => {
  runTest({
    input: `foo = require("tape");
console.log(foo);
`,
    expected: `import * as _mod from "tape";
foo = _mod;
console.log(foo);`,
  });
});

Deno.test("commonjs - require function call", () => {
  runTest({
    input: `var a = require('./a')()`,
    expected: `import * as _mod from './a';
var a = (_mod.default ?? _mod)();`,
  });
});

Deno.test("commonjs - require var decls", () => {
  runTest({
    input: `var a = require('./a'), b = 42;`,
    expected: `import * as _mod from './a';
var a = _mod.default ?? _mod,
  b = 42;`,
  });
});

Deno.test("commonjs - duplicate exports", () => {
  runTest({
    input: `Object.defineProperty(exports, "__esModule", { value: true });
exports.trace = void 0;
exports.trace = 'foo'`,
    expected: `export let trace = 'foo';`,
  });
});

// I've never seen this, seems rare. Skipping for now.
Deno.test.ignore("commonjs - require", () => {
  runTest({
    input: `module.exports = { __esModule: true, default: { foo: 'bar' }}`,
    expected: `import * as foo from "tape";
console.log(foo)`,
  });
});

// TODO
Deno.test.ignore("commonjs - export default object", () => {
  runTest({
    input: `Object.defineProperty(exports, '__esModule', { value: true });
module.exports = { foo: 'bar' };
`,
    expected: `export let foo = 'bar';
export let bar = 'foo';`,
  });
});
