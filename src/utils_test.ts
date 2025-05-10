import { expect } from "@std/expect";
import { mergePaths } from "./utils.ts";

Deno.test("mergePaths", () => {
  expect(mergePaths("", "")).toEqual("");
  expect(mergePaths("/", "/foo")).toEqual("/foo");
  expect(mergePaths("/*", "/foo")).toEqual("/foo");
  expect(mergePaths("/foo/bar", "/baz")).toEqual("/foo/bar/baz");
  expect(mergePaths("/foo/bar/", "/baz")).toEqual("/foo/bar/baz");
  expect(mergePaths("/foo/bar", "baz")).toEqual("/foo/bar/baz");
});
