import { expect } from "@std/expect";
import { parseRootPath } from "./config.ts";
import { osType } from "$std/path/_os.ts";

Deno.test("parseRootPath", () => {
  const cwd = Deno.cwd();
  const isWindows = osType === "windows";
  const slash = isWindows ? "\\" : "/";
  /** ../ */
  const currentPathMinusOneDir = cwd.split(slash).slice(0, -1).join(slash);

  expect(parseRootPath("file:///foo/bar", cwd)).toEqual(
    slash + "foo" + slash + "bar",
  );
  expect(parseRootPath("/foo/bar", cwd)).toEqual("/foo/bar");
  expect(parseRootPath("/foo/bar.ts", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo/bar.tsx", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo/bar.js", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo/bar.jsx", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo/bar.mjs", cwd)).toEqual("/foo");
  expect(
    parseRootPath("./foo/bar.ts", cwd).endsWith(slash + "foo"),
  ).toBeTruthy();
  expect(parseRootPath("../foo/bar.ts", cwd)).toEqual(
    currentPathMinusOneDir + slash + "foo",
  );

  if (isWindows) {
    expect(parseRootPath("C:\\foo\\bar.ts", cwd)).toEqual("C:\\foo");
    expect(parseRootPath("C:/foo/bar.ts", cwd)).toEqual("C:/foo");
  }

  expect(parseRootPath("/foo/bar.baz", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo/bar.tar.gz", cwd)).toEqual("/foo");
  expect(parseRootPath("foo/bar.ts", cwd)).toEqual(cwd + slash + "foo");
  expect(parseRootPath("foo/bar.js", cwd)).toEqual(cwd + slash + "foo");
  expect(parseRootPath("/foo/bar/baz.js", cwd)).toEqual("/foo/bar");
  expect(parseRootPath("/foo/bar/baz/", cwd)).toEqual("/foo/bar/baz");
  expect(parseRootPath("/foo/", cwd)).toEqual("/foo");
  expect(parseRootPath("/foo", cwd)).toEqual("/foo");
  expect(parseRootPath("/", cwd)).toEqual(cwd);
});
