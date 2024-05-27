import { expect } from "@std/expect";
import { HttpError } from "./error.ts";

Deno.test("HttpError - contains stack if error >=500", () => {
  const err = new HttpError(404);
  expect(err.status).toEqual(404);
  expect(typeof err.stack).toEqual("undefined");

  const err2 = new HttpError(500);
  expect(err2.status).toEqual(500);
  expect(typeof err2.stack).toEqual("string");
});
