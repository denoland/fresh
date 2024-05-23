import { expect } from "@std/expect";
import { parseRootPath } from "./config.ts";

Deno.test("parseRootPath", () => {
  expect(parseRootPath("file:///foo/bar")).toEqual("/foo/bar");
  expect(parseRootPath("file:///foo/bar.ts")).toEqual("/foo");
  expect(parseRootPath("/foo/bar")).toEqual("/foo/bar");
  expect(parseRootPath("/foo/bar.ts")).toEqual("/foo");
  expect(parseRootPath("/foo/bar.tsx")).toEqual("/foo");
  expect(parseRootPath("/foo/bar.js")).toEqual("/foo");
  expect(parseRootPath("/foo/bar.jsx")).toEqual("/foo");
  expect(parseRootPath("/foo/bar.mjs")).toEqual("/foo");
});
