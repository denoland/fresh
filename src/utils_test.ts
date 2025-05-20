import { expect } from "@std/expect";
import { mergePaths, pathToExportName } from "./utils.ts";

Deno.test("mergePaths", () => {
  expect(mergePaths("", "")).toEqual("");
  expect(mergePaths("/", "/foo")).toEqual("/foo");
  expect(mergePaths("/*", "/foo")).toEqual("/foo");
  expect(mergePaths("/foo/bar", "/baz")).toEqual("/foo/bar/baz");
  expect(mergePaths("/foo/bar/", "/baz")).toEqual("/foo/bar/baz");
  expect(mergePaths("/foo/bar", "baz")).toEqual("/foo/bar/baz");
});

Deno.test("filenameToExportName", () => {
  expect(pathToExportName("/islands/foo.tsx")).toBe("foo");
  expect(pathToExportName("/islands/foo.v2.tsx")).toBe("foo_v2");
  expect(pathToExportName("/islands/nav-bar.tsx")).toBe("nav_bar");
  expect(pathToExportName("/islands/_.$bar.tsx")).toBe("_$bar");
  expect(pathToExportName("/islands/1.hello.tsx")).toBe("_hello");
});
