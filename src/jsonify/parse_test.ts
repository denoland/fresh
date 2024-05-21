import { expect } from "@std/expect";
import { parse } from "./parse.ts";

Deno.test("parse - json", () => {
  expect(parse("[2]")).toEqual(2);
  expect(parse('["abc"]')).toEqual("abc");
  expect(parse("[true]")).toEqual(true);
  expect(parse("[false]")).toEqual(false);
  expect(parse("[[1,2,3],1,2,3]")).toEqual([1, 2, 3]);
  expect(parse('[{"a":1,"b":-2,"c":2},1,[-2]]')).toEqual({
    a: 1,
    b: null,
    c: [null],
  });
});

Deno.test("parse - hole array", () => {
  expect(parse("[[1,-7,2],1,3]")).toEqual([1, , 3]);
});

Deno.test("parse - undefined", () => {
  expect(parse("[-1]")).toEqual(undefined);
});

Deno.test("parse - Inifinity", () => {
  expect(parse("[-4]")).toEqual(Infinity);
  expect(parse("[-5]")).toEqual(-Infinity);
});

Deno.test("parse - NaN", () => {
  expect(parse("[-3]")).toEqual(NaN);
});

Deno.test("parse - -0", () => {
  expect(parse("[-6]")).toEqual(-0);
});

Deno.test("parse - bigint", () => {
  const n = BigInt(9007199254740991);
  expect(parse('[["BigInt","9007199254740991"]]')).toEqual(
    n,
  );
});

Deno.test("parse - Set", () => {
  const res = parse('[["Set",[1,2]],1,{"foo":1}]');
  expect(res).toEqual(
    new Set([1, { foo: 1 }]),
  );
});

Deno.test("parse - Map", () => {
  expect(parse('[["Map",[1,2,3,4]],1,{"foo":1},2,3]'))
    .toEqual(
      new Map<number, unknown>([[1, { foo: 1 }], [2, 3]]),
    );
});

Deno.test("parse - Date", () => {
  const date = new Date("1990-05-31");
  expect(parse('[["Date","1990-05-31T00:00:00.000Z"]]')).toEqual(
    date,
  );
});

Deno.test("parse - RegExp", () => {
  let reg = /foo["]/;
  expect(parse('[["RegExp","foo[\\"]", ""]]')).toEqual(reg);

  reg = /foo["]/g;
  expect(parse('[["RegExp","foo[\\"]", "g"]]')).toEqual(reg);
});

Deno.test("parse - Uint8Array", () => {
  const value = new Uint8Array([1, 2, 3]);
  expect(parse('[["Uint8Array","AQID"]]')).toEqual(
    value,
  );
});

Deno.test("parse - references", () => {
  const inner = { foo: 123 };
  const obj = { a: inner, b: [inner, inner] };
  const res = parse<typeof obj>('[{"a":1,"b":3},{"foo":2},123,[1,1]]');
  expect(res).toEqual(obj);
  expect(res.a).toEqual(res.b[0]);
  expect(res.a).toEqual(res.b[1]);
});

Deno.test("parse - circular references", () => {
  // deno-lint-ignore no-explicit-any
  const foo = { foo: null as any };
  foo.foo = foo;
  expect(parse('[{"foo":0}]')).toEqual(foo);
});

Deno.test("parse - object", () => {
  expect(parse('[{"foo":1},42]')).toEqual({ foo: 42 });
});
