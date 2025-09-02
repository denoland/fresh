import { expect } from "@std/expect/expect";
import * as babel from "@babel/core";
import { inlineEnvVarsPlugin } from "./inline_env_vars.ts";
import { usingEnv } from "../../../tests/test_utils.ts";

function runTest(options: { input: string; expected: string; mode?: string }) {
  const res = babel.transformSync(options.input, {
    filename: "foo.js",
    babelrc: false,
    plugins: [inlineEnvVarsPlugin(options.mode ?? "development")],
  });

  const output = res?.code ?? "";
  expect(output).toEqual(options.expected);
}

Deno.test("env vars - inline NODE_ENV", () => {
  using _ = usingEnv("NODE_ENV", "foobar");
  runTest({
    input: `() => process.env.NODE_ENV`,
    expected: `() => "foobar";`,
  });
});

Deno.test("env vars - inline NODE_ENV mode", () => {
  runTest({
    input: `() => process.env.NODE_ENV`,
    expected: `() => "asdf";`,
    mode: "asdf",
  });
});

Deno.test("env vars - inline custom process.env.*", () => {
  using _ = usingEnv("FRESH_PUBLIC_FOO", "a");
  runTest({
    input: `() => process.env.FRESH_PUBLIC_FOO`,
    expected: `() => "a";`,
  });
});

Deno.test("env vars - inline Deno.env.get()", () => {
  using _ = usingEnv("FRESH_PUBLIC_FOO", "b");
  runTest({
    input: `() => Deno.env.get("FRESH_PUBLIC_FOO")`,
    expected: `() => "b";`,
  });
});

Deno.test("env vars - inline Deno.env.get(NODE_ENV)", () => {
  using _ = usingEnv("NODE_ENV", "c");
  runTest({
    input: `() => Deno.env.get("NODE_ENV")`,
    expected: `() => "c";`,
  });
});

Deno.test("env vars - inline Deno.env.get(NODE_ENV) mode", () => {
  runTest({
    input: `() => Deno.env.get("NODE_ENV")`,
    expected: `() => "test";`,
    mode: "test",
  });
});

Deno.test("env vars - inline const _ = Deno.env.get()", () => {
  using _ = usingEnv("FRESH_PUBLIC_FOO", "test");
  runTest({
    input: `const deno = Deno.env.get("FRESH_PUBLIC_FOO");`,
    expected: `const deno = "test";`,
  });
});

Deno.test("env vars - inline import.meta.env.FRESH_PUBLIC_FOO", () => {
  using _ = usingEnv("FRESH_PUBLIC_FOO", "test");
  runTest({
    input: `() => import.meta.env.FRESH_PUBLIC_FOO;`,
    expected: `() => "test";`,
  });
});
