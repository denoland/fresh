import { expect } from "@std/expect";
import { stringify } from "./stringify.ts";

Deno.test("stringify - json", () => {
  expect(stringify(2)).toEqual("[2]");
  expect(stringify("abc")).toEqual('["abc"]');
  expect(stringify(true)).toEqual("[true]");
  expect(stringify(false)).toEqual("[false]");
  expect(stringify([1, 2, 3])).toEqual("[[1,2,3],1,2,3]");
  expect(stringify({ a: 1, b: null, c: [null] })).toEqual(
    '[{"a":1,"b":-2,"c":2},1,[-2]]',
  );
});

Deno.test("stringify - hole array", () => {
  expect(stringify([1, , 3])).toEqual("[[1,-7,2],1,3]");
});

Deno.test("stringify - undefined", () => {
  expect(stringify(undefined)).toEqual("[-1]");
});

Deno.test("stringify - Infinity", () => {
  expect(stringify(Infinity)).toEqual("[-4]");
  expect(stringify(-Infinity)).toEqual("[-5]");
});

Deno.test("stringify - NaN", () => {
  expect(stringify(NaN)).toEqual("[-3]");
});

Deno.test("stringify - -0", () => {
  expect(stringify(-0)).toEqual("[-6]");
});

Deno.test("stringify - bigint", () => {
  const n = BigInt(9007199254740991);
  expect(stringify(n)).toEqual(
    '[["BigInt","9007199254740991"]]',
  );
});

Deno.test("stringify - Date", () => {
  const date = new Date("1990-05-31");
  expect(stringify(date)).toEqual(
    '[["Date","1990-05-31T00:00:00.000Z"]]',
  );
});

Deno.test("stringify - RegExp", () => {
  let reg = /foo["]/;
  expect(stringify(reg)).toEqual(
    '[["RegExp","foo[\\"]", ""]]',
  );

  reg = /foo["]/g;
  expect(stringify(reg)).toEqual(
    '[["RegExp","foo[\\"]", "g"]]',
  );
});

Deno.test("stringify - Set", () => {
  expect(stringify(new Set([1, { foo: 1 }]))).toEqual(
    '[["Set",[1,2]],1,{"foo":1}]',
  );
});

Deno.test("stringify - Map", () => {
  expect(stringify(new Map<number, unknown>([[1, { foo: 1 }], [2, 3]])))
    .toEqual(
      '[["Map",[1,2,3,4]],1,{"foo":1},2,3]',
    );
});

Deno.test("stringify - Uint8Array", () => {
  const value = new Uint8Array([1, 2, 3]);
  expect(stringify(value)).toEqual(
    '[["Uint8Array","AQID"]]',
  );
});

Deno.test("stringify - references", () => {
  const inner = { foo: 123 };
  const obj = { a: inner, b: [inner, inner] };
  expect(stringify(obj)).toEqual(
    '[{"a":1,"b":3},{"foo":2},123,[1,1]]',
  );
});

Deno.test("stringify - circular references", () => {
  // deno-lint-ignore no-explicit-any
  const foo = { foo: null as any };
  foo.foo = foo;
  expect(stringify(foo)).toEqual(
    '[{"foo":0}]',
  );
});

Deno.test("stringify - object prototype", () => {
  const obj = { __proto__: 123, foo: 1 };
  expect(stringify(obj)).toEqual(
    '[{"foo":1},1]',
  );
});

Deno.test("stringify - throw serializing functions", () => {
  const fn = () => {};
  expect(() => stringify(fn)).toThrow();
});
