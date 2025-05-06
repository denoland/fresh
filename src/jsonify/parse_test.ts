import { expect } from "@std/expect";
import { parse } from "./parse.ts";
import { stringify } from "./stringify.ts";
import { Signal, signal } from "@preact/signals";

Deno.test("custom parse - Point", () => {
  class Point {
    constructor(public x: number, public y: number) {
      this.x = x;
      this.y = y;
    }
  }

  const str = stringify(new Point(30, 40), {
    Point: (value) =>
      value instanceof Point ? { value: [value.x, value.y] } : undefined,
  });

  expect(str).toEqual('[["Point",1],[2,3],30,40]');

  const point = parse(str, {
    Point: ([x, y]: [number, number]) => new Point(x, y),
  });
  expect(point).toEqual(new Point(30, 40));
});

Deno.test("custom parse - Signals", () => {
  const res = parse<Signal>('[["Signal",1],2]', {
    Signal: (value) => signal(value),
  });
  expect(res).toBeInstanceOf(Signal);
  expect(res.peek()).toEqual(2);
});

Deno.test("custom parse - Signals with null value", () => {
  const res = parse<Signal>('[["Signal",-2]]', {
    Signal: (value) => signal(value),
  });
  expect(res).toBeInstanceOf(Signal);
  expect(res.peek()).toEqual(null);
});

Deno.test("custom parse - Signals with undefined value", () => {
  const res = parse<Signal>('[["Signal",-1]]', {
    Signal: (value) => signal(value),
  });
  expect(res).toBeInstanceOf(Signal);
  expect(res.peek()).toEqual(undefined);
});
