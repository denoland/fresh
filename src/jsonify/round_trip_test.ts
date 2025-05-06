import { expect } from "@std/expect";
import { parse } from "./parse.ts";
import { stringify } from "./stringify.ts";

const inner = { foo: 123 };
const references = { a: inner, b: [inner, inner] };

const circular = { a: 1, b: null as unknown };
circular.b = circular;

const TESTS = [
  undefined,
  null,
  1,
  2,
  -2,
  Infinity,
  -Infinity,
  0,
  -0,
  NaN,
  1.2 -
  1.2,
  true,
  false,
  "abc",
  1n,
  -1n,
  [1, 2, 3],
  [null, undefined, -2],
  { a: 1, b: null, c: -2 },
  new Uint8Array([1, 2, 3]),
  new Date("1990-05-31"),
  new Map([[1, null], [undefined, -2]]),
  new Set([1, 2, null, -2, NaN]),
  [1, , 3],
  /foo["]/,
  references,
  circular,
];

for (const value of TESTS) {
  Deno.test(`round trip - ${Deno.inspect(value)}`, () => {
    const str = stringify(value);
    const parsed = parse(str);
    expect(parsed).toEqual(value);
  });
}
