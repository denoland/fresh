import { expect } from "@std/expect";
import { parseRootPath } from "./config.ts";

// FIXME: Windows
Deno.test.ignore("parseRootPath", () => {
  const cwd = Deno.cwd();
  expect(parseRootPath("file:///foo/bar", cwd)).toEqual("/foo/bar");
  expect(parseRootPath("file:///foo/bar.ts", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo/bar", cwd)).toEqual("/foo/bar");
  expect(parseRootPath("/foo/bar.ts", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo/bar.tsx", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo/bar.js", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo/bar.jsx", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo/bar.mjs", cwd)).toEqual("/foo");
});
