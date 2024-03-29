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
    Point: (value) => value instanceof Point ? [value.x, value.y] : undefined,
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

Deno.test("custom stringify - Signals", () => {
  const s = signal(2);
  expect(stringify(s, {
    Signal: (s2: unknown) => {
      return s2 instanceof Signal ? s2.peek() : undefined;
    },
  })).toEqual(
    '[["Signal",1],2]',
  );
});

Deno.test("custom stringify - referenced Signals", () => {
  const s = signal(2);
  expect(stringify([s, s], {
    Signal: (s2: unknown) => {
      return s2 instanceof Signal ? s2.peek() : undefined;
    },
  })).toEqual(
    '[[1,1],["Signal",2],2]',
  );
});
