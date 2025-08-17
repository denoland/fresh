import { expect } from "@std/expect/expect";
import * as babel from "@babel/core";
import { httpAbsolute } from "./http_absolute.ts";

function runTest(options: { input: string; expected: string; url?: URL }) {
  const res = babel.transformSync(options.input, {
    filename: "foo.js",
    babelrc: false,
    plugins: [httpAbsolute(options.url ?? null)],
  });

  const output = res?.code ?? "";
  expect(output).toEqual(options.expected);
}

Deno.test("http absolute - change import sources", () => {
  runTest({
    input: `import foo from "/foo.js"`,
    expected: `import foo from "http://localhost/foo.js";`,
    url: new URL("http://localhost"),
  });
});

Deno.test("http absolute - change export all sources", () => {
  runTest({
    input: `export * as foo from "/foo.js"`,
    expected: `export * as foo from "http://localhost/foo.js";`,
    url: new URL("http://localhost"),
  });
});

Deno.test("http absolute - change export sources", () => {
  runTest({
    input: `export { foo } from "/foo.js"`,
    expected: `export { foo } from "http://localhost/foo.js";`,
    url: new URL("http://localhost"),
  });
});

Deno.test("http absolute - change import()", () => {
  runTest({
    input: `import("/foo.js")`,
    expected: `import("http://localhost/foo.js");`,
    url: new URL("http://localhost"),
  });
});
