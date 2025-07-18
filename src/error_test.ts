import { expect } from "@std/expect";
import { HttpError } from "./error.ts";

Deno.test("HttpError", () => {
  const err = new HttpError(404);
  expect(err.status).toEqual(404);
  expect(typeof err.stack).toEqual("string");

  const err2 = new HttpError(500);
  expect(err2.status).toEqual(500);
  expect(typeof err2.stack).toEqual("string");
});

Deno.test("HttpError - message", () => {
  const err = new HttpError(500, "foo");
  expect(err.message).toEqual("foo");
});

Deno.test("HttpError - cause", () => {
  const causeErr = new Error();
  const err = new HttpError(500, "foo", { cause: causeErr });
  expect(err.cause).toEqual(causeErr);
});
