import { expect } from "@std/expect";
import { MODE, setMode } from "./runtime/server/mod.tsx";
import { HttpError } from "./error.ts";

Deno.test("HttpError - contains stack in development", () => {
  const tmp = MODE;
  setMode("development");
  try {
    const err = new HttpError(404);
    expect(err.status).toEqual(404);
    expect(typeof err.stack).toEqual("string");
  } finally {
    setMode(tmp);
  }
});

Deno.test("HttpError - contains no stack in production", () => {
  const tmp = MODE;
  setMode("production");
  try {
    const err = new HttpError(404);
    expect(err.status).toEqual(404);
    expect(err.stack).toEqual(undefined);
  } finally {
    setMode(tmp);
  }
});
