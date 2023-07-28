import { assertEquals, assertThrows } from "$std/testing/asserts.ts";
import { assert } from "../../tests/deps.ts";
import {
  middlewarePathToPattern,
  pathToPattern,
  selectMiddlewares,
} from "./context.ts";
import { MiddlewareRoute } from "./types.ts";

Deno.test("selectMiddlewares", () => {
  const url = "https://fresh.deno.dev/api/abc/def";
  const middlewaresPath = [
    // should select
    "_middleware",
    "api/_middleware",
    "api/[id]/_middleware",
    "api/[id]/[path]/_middleware",

    // should not select
    "api/xyz/_middleware",
    "api/[id]/xyz/_middleware",
    "api/[id]/[path]/foo/_middleware",
  ];
  const mwRoutes = middlewaresPath.map((path) =>
    middlewarePathToPattern(path)
  ) as MiddlewareRoute[];
  const mws = selectMiddlewares(url, mwRoutes);
  assert(mws.length === 4);
});

Deno.test("pathToPattern", async (t) => {
  await t.step("creates pattern", () => {
    assertEquals(pathToPattern("foo/bar"), "/foo/bar");
  });

  await t.step("parses index routes", () => {
    assertEquals(pathToPattern("foo/index"), "/foo");
  });

  await t.step("parses parameters", () => {
    assertEquals(pathToPattern("foo/[name]"), "/foo/:name");
    assertEquals(pathToPattern("foo/[name]/bar/[bob]"), "/foo/:name/bar/:bob");
  });

  await t.step("parses catchall", () => {
    assertEquals(pathToPattern("foo/[...name]"), "/foo/:name*");
  });

  await t.step("parses multiple params in same part", () => {
    assertEquals(pathToPattern("foo/[mod]@[version]"), "/foo/:mod@:version");

    assertEquals(pathToPattern("foo/[bar].json"), "/foo/:bar.json");
    assertEquals(pathToPattern("foo/foo[bar]"), "/foo/foo:bar");
  });

  await t.step("throws on invalid patterns", () => {
    assertThrows(() => pathToPattern("foo/[foo][bar]"));
    assertThrows(() => pathToPattern("foo/foo]"));
    assertThrows(() => pathToPattern("foo/[foo]]"));
  });
});
