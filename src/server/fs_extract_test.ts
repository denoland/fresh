import { assertEquals, assertThrows } from "$std/testing/asserts.ts";
import { pathToPattern, sortRoutePaths } from "./fs_extract.ts";

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

  await t.step("parses optional params", () => {
    assertEquals(pathToPattern("foo/[[name]]"), "/foo{/:name}?");
    assertEquals(pathToPattern("foo/[name]/[[bob]]"), "/foo/:name{/:bob}?");
    assertEquals(pathToPattern("foo/[[name]]/bar"), "/foo{/:name}?/bar");
    assertEquals(
      pathToPattern("foo/[[name]]/bar/[[bob]]"),
      "/foo{/:name}?/bar{/:bob}?",
    );
  });

  await t.step("throws on invalid patterns", () => {
    assertThrows(() => pathToPattern("foo/[foo][bar]"));
    assertThrows(() => pathToPattern("foo/foo]"));
    assertThrows(() => pathToPattern("foo/[foo]]"));
    assertThrows(() => pathToPattern("foo/foo-[[name]]-bar/baz"));
    assertThrows(() => pathToPattern("foo/[[name]]-bar/baz"));
    assertThrows(() => pathToPattern("foo/foo-[[name]]/baz"));
    assertThrows(() => pathToPattern("foo/foo-[[name]]"));
    assertThrows(() => pathToPattern("foo/[[name]]-bar"));
  });
});

Deno.test("sortRoutePaths", () => {
  const routes = [
    "/foo/[id]",
    "/foo/[...slug]",
    "/foo/bar",
    "/foo/_layout",
    "/foo/index",
    "/foo/_middleware",
    "/foo/bar/_middleware",
    "/foo/bar/index",
    "/foo/bar/[...foo]",
    "/foo/bar/baz",
    "/foo/bar/_layout",
  ];
  const sorted = [
    "/foo/_middleware",
    "/foo/_layout",
    "/foo/bar",
    "/foo/index",
    "/foo/bar/_middleware",
    "/foo/bar/_layout",
    "/foo/bar/index",
    "/foo/bar/baz",
    "/foo/bar/[...foo]",
    "/foo/[id]",
    "/foo/[...slug]",
  ];
  routes.sort(sortRoutePaths);
  assertEquals(routes, sorted);
});
