import { expect } from "@std/expect";
import { parseDirPath } from "./config.ts";

Deno.test("parseDirPath", () => {
  const cwd = Deno.cwd().replaceAll("\\", "/");

  // File paths
  expect(parseDirPath("file:///foo/bar", cwd)).toEqual("/foo/bar");
  if (Deno.build.os === "windows") {
    expect(parseDirPath("file:///C:/foo/bar", cwd)).toEqual("C:/foo/bar");
  }

  // Relative paths
  expect(parseDirPath("./foo/bar", cwd)).toEqual(`${cwd}/foo/bar`);

  // Absolute paths
  expect(parseDirPath("/foo/bar", cwd)).toEqual("/foo/bar");
  if (Deno.build.os === "windows") {
    expect(parseDirPath("C:/foo/bar", cwd)).toEqual("C:/foo/bar");
  }
});
