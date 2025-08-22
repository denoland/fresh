import { expect } from "@std/expect/expect";
import * as babel from "@babel/core";
import { removePolyfills } from "./remove_polyfills.ts";

function runTest(options: { input: string; expected: string }) {
  const res = babel.transformSync(options.input, {
    filename: "foo.js",
    babelrc: false,
    plugins: [removePolyfills],
  });

  const output = res?.code ?? "";
  expect(output).toEqual(options.expected);
}

Deno.test("remove polyfills - Object.keys", () => {
  runTest({
    input: `if (!Object.keys) {
    Object.keys = function (o) {
    var a = []
    for (var i in o) if (o.hasOwnProperty(i)) a.push(i)
    return a
  }
}

Object.keys({ foo: "bar" });`,
    expected: `Object.keys({
  foo: "bar"
});`,
  });
});

Deno.test("remove polyfills - Object.create", () => {
  runTest({
    input: `if (!Object.create) {
  Object.create = function (o) {
    function F () {}
    F.prototype = o
    var newf = new F()
    return newf
  }
}

Object.create({});`,
    expected: `Object.create({});`,
  });
});

Deno.test("remove polyfills - keep alternate", () => {
  runTest({
    input: `if (!Object.create) {
  Object.create = function (o) {
    function F () {}
    F.prototype = o
    var newf = new F()
    return newf
  }
} else {
  console.log("foo")
}`,
    expected: `{
  console.log("foo");
}`,
  });
});

Deno.test("remove polyfills - String.fromCodePoint", () => {
  runTest({
    input: `if (!String.fromCodePoint) {
  foo
}
  
String.fromCodePoint(42);`,
    expected: `String.fromCodePoint(42);`,
  });
});

Deno.test("remove polyfills - Keep unrelated unary statements", () => {
  runTest({
    input: `if (+String.fromCodePoint) {
  foo;
}`,
    expected: `if (+String.fromCodePoint) {
  foo;
}`,
  });
});
