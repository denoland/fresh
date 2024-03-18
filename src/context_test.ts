import { expect } from "@std/expect";
import { redirectTo } from "./context.ts";

Deno.test("redirectTo", () => {
  let res = redirectTo("/");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("/");

  res = redirectTo("//evil.com");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("/evil.com");

  res = redirectTo("//evil.com/foo//bar");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("/evil.com/foo/bar");

  res = redirectTo("https://deno.com");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("https://deno.com");

  res = redirectTo("/", 307);
  expect(res.status).toEqual(307);
});
