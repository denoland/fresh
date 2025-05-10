import { expect } from "@std/expect";
import { normalizeConfig, parseRootPath } from "./config.ts";

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

Deno.test("normalizeConfig - root", () => {
  const cwd = Deno.cwd().replaceAll("\\", "/");
  const configRoot = (root?: string) => normalizeConfig({ root }).root;

  expect(configRoot()).toEqual(cwd);
  expect(configRoot("/foo/bar")).toEqual("/foo/bar");
  expect(configRoot("/foo/bar.ts")).toEqual("/foo");
  expect(configRoot("file:///foo/bar")).toEqual("/foo/bar");
  expect(configRoot("./foo/bar")).toEqual(`${cwd}/foo/bar`);
  expect(configRoot("./foo/bar.ts")).toEqual(`${cwd}/foo`);

  if (Deno.build.os === "windows") {
    expect(configRoot("C:/foo/bar.ts")).toEqual("C:/foo");
    expect(configRoot("file:///C:/foo/bar")).toEqual("C:/foo/bar");
  }
});
