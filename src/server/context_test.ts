import { assertEquals, assertThrows } from "$std/testing/asserts.ts";
import { assert } from "../../tests/deps.ts";
import {
  middlewarePathToPattern,
  pathToPattern,
  routeWarnings,
  selectMiddlewares,
} from "./context.ts";
import { MiddlewareRoute, Route } from "./types.ts";

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

Deno.test({
  name: "dynamic route conflicts",
  fn() {
    const routes = [
      { name: "control-index", pattern: "/control" }, //routes/control/index.tsx
      { name: "control-normal_route", pattern: "/control/normal_route" }, //routes/control/normal_route.tsx
      {
        name: "two_dynamic-[second_dynamic]",
        pattern: "/two_dynamic/:second_dynamic",
      }, //routes/two_dynamic/[second_dynamic].tsx
      { name: "two_dynamic-[dynamic]", pattern: "/two_dynamic/:dynamic" }, //routes/two_dynamic/[dynamic].tsx
      { name: "override-[dynamic]", pattern: "/override/:dynamic" }, //routes/override/[dynamic].tsx
      { name: "override-override", pattern: "/override/:path*" }, //routes/override/override.tsx  note this should have a routeOverride
      { name: "nested-[tenant]/level1", pattern: "/nested/:tenant/level1" }, //routes/nested/[tenant]/level1.tsx
      { name: "nested-level2", pattern: "/nested/:tenant/foo" }, //routes/nested/level2.tsx  note this should have a routeOverride
      { name: "nested2-[foo]/bar", pattern: "/nested2/:foo/bar" }, //routes/nested2/[foo]/bar.tsx
      { name: "nested2-foo/[bar]", pattern: "/nested2/foo/:bar" }, //routes/nested2/foo/[bar].tsx
    ] as Route[];
    const expected = [
      `Potential route conflict. The following dynamic routes may conflict:\n  /two_dynamic/:second_dynamic\n  /two_dynamic/:dynamic\n`,
      `Potential route conflict. The following dynamic routes may conflict:\n  /override/:dynamic\n  /override/:path*\n`,
      `Potential route conflict. The following dynamic routes may conflict:\n  /nested/:tenant/level1\n  /nested/:tenant/foo\n`,
    ];
    const output = routeWarnings(routes);
    assertEquals(output, expected);
  },
});
