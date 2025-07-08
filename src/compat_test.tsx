import type { PageProps } from "./context.ts";
import { assertType, type IsExact } from "@std/testing/types";
import { expect } from "@std/expect";
import { type defineApp, type defineLayout, defineRoute } from "./compat.ts";

Deno.test("compat - defineFn works", () => {
  const ctx = {} as PageProps<unknown>;
  expect(defineRoute(() => new Response("test"))(ctx)).toBeInstanceOf(Response);
  expect(defineRoute(() => <span>test</span>)(ctx)).toBeInstanceOf(Object);
  expect(defineRoute(() => null)(ctx)).toEqual(null);
});

Deno.test("compat - functions equivalent", () => {
  assertType<IsExact<typeof defineApp, typeof defineRoute>>(true);
  assertType<IsExact<typeof defineRoute, typeof defineLayout>>(true);
});
