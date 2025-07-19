import { expect } from "@std/expect";
import { HttpError } from "./error.ts";

Deno.test("HttpError", () => {
  const err = new HttpError(404);
  expect(err.status).toEqual(404);
  expect(err.message).toEqual("Not Found");
  expect(typeof err.stack).toEqual("string");

  const err2 = new HttpError(500);
  expect(err2.status).toEqual(500);
  expect(err2.message).toEqual("Internal Server Error");
  expect(typeof err2.stack).toEqual("string");
});
