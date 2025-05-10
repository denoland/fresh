import { expect } from "@std/expect";
import { parseRootPath } from "./config.ts";

Deno.test("parseRootPath", () => {
  const cwd = Deno.cwd().replaceAll("\\", "/");

  // File paths
  expect(parseRootPath("file:///foo/bar", cwd)).toEqual("/foo/bar");
  expect(parseRootPath("file:///foo/bar.ts", cwd)).toEqual("/foo");
  if (Deno.build.os === "windows") {
    expect(parseRootPath("file:///C:/foo/bar", cwd)).toEqual("C:/foo/bar");
    expect(parseRootPath("file:///C:/foo/bar.ts", cwd)).toEqual("C:/foo");
  }

  // Relative paths
  expect(parseRootPath("./foo/bar", cwd)).toEqual(`${cwd}/foo/bar`);
  expect(parseRootPath("./foo/bar.ts", cwd)).toEqual(`${cwd}/foo`);

  // Absolute paths
  expect(parseRootPath("/foo/bar", cwd)).toEqual("/foo/bar");
  expect(parseRootPath("/foo/bar.ts", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo/bar.tsx", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo/bar.js", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo/bar.jsx", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo/bar.mjs", cwd)).toEqual("/foo");
  if (Deno.build.os === "windows") {
    expect(parseRootPath("C:/foo/bar", cwd)).toEqual("C:/foo/bar");
    expect(parseRootPath("C:/foo/bar.ts", cwd)).toEqual("C:/foo");
  }
});
