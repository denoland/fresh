import { expect } from "@std/expect";
import { stringify } from "./stringify.ts";
import { Signal, signal } from "@preact/signals";

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

Deno.test("custom stringify - Signals", () => {
  const s = signal(2);
  expect(stringify(s, {
    Signal: (s2: unknown) => {
      return s2 instanceof Signal ? { value: s2.peek() } : undefined;
    },
  })).toEqual(
    '[["Signal",1],2]',
  );
});

Deno.test("custom stringify - Signals with null value", () => {
  const s = signal(null);
  expect(stringify(s, {
    Signal: (s2: unknown) => {
      return s2 instanceof Signal ? { value: s2.peek() } : undefined;
    },
  })).toEqual(
    '[["Signal",-2]]',
  );
});

Deno.test("custom stringify - Signals with undefined value", () => {
  const s = signal(undefined);
  expect(stringify(s, {
    Signal: (s2: unknown) => {
      return s2 instanceof Signal ? { value: s2.peek() } : undefined;
    },
  })).toEqual(
    '[["Signal",-1]]',
  );
});

Deno.test("custom stringify - referenced Signals", () => {
  const s = signal(2);
  expect(stringify([s, s], {
    Signal: (s2: unknown) => {
      return s2 instanceof Signal ? { value: s2.peek() } : undefined;
    },
  })).toEqual(
    '[[1,1],["Signal",2],2]',
  );
});
