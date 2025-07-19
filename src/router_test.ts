import { expect } from "@std/expect";
import {
  IS_PATTERN,
  mergePath,
  pathToPattern,
  patternToSegments,
  UrlPatternRouter,
} from "./router.ts";

Deno.test("IS_PATTERN", () => {
  expect(IS_PATTERN.test("/foo")).toEqual(false);
  expect(IS_PATTERN.test("/foo/bar/baz.jpg")).toEqual(false);
  expect(IS_PATTERN.test("/foo/:path")).toEqual(true);
  expect(IS_PATTERN.test("/foo/*")).toEqual(true);
  expect(IS_PATTERN.test("/foo{/bar}?")).toEqual(true);
  expect(IS_PATTERN.test("/foo/(\\d+)")).toEqual(true);
  expect(IS_PATTERN.test("/foo/(a)")).toEqual(true);
});

Deno.test("UrlPatternRouter - GET extract params", () => {
  const router = new UrlPatternRouter();
  const A = () => {};
  router.add("GET", "/:foo/:bar/c", [A]);

  let res = router.match("GET", new URL("/a/b/c", "http://localhost"));
  expect(res).toEqual({
    params: { foo: "a", bar: "b" },
    handlers: [A],
    methodMatch: true,
    pattern: "/:foo/:bar/c",
  });

  // Decode params
  res = router.match("GET", new URL("/a%20a/b/c", "http://localhost"));
  expect(res).toEqual({
    params: { foo: "a a", bar: "b" },
    handlers: [A],
    methodMatch: true,
    pattern: "/:foo/:bar/c",
  });
});

Deno.test("UrlPatternRouter - Wrong method match", () => {
  const router = new UrlPatternRouter();
  const A = () => {};
  router.add("GET", "/foo", [A]);

  const res = router.match("POST", new URL("/foo", "http://localhost"));
  expect(res).toEqual({
    params: Object.create(null),
    handlers: [],
    methodMatch: false,
    pattern: "/foo",
  });
});

Deno.test("UrlPatternRouter - wrong + correct method", () => {
  const router = new UrlPatternRouter();
  const A = () => {};
  const B = () => {};
  router.add("GET", "/foo", [A]);
  router.add("POST", "/foo", [B]);

  const res = router.match("POST", new URL("/foo", "http://localhost"));
  expect(res).toEqual({
    params: Object.create(null),
    handlers: [B],
    methodMatch: true,
    pattern: "/foo",
  });
});

Deno.test("UrlPatternRouter - convert patterns automatically", () => {
  const router = new UrlPatternRouter();
  const A = () => {};
  router.add("GET", "/books/:id", [A]);

  const res = router.match("GET", new URL("/books/foo", "http://localhost"));
  expect(res).toEqual({
    params: {
      id: "foo",
    },
    handlers: [A],
    methodMatch: true,
    pattern: "/books/:id",
  });
});

Deno.test("pathToPattern", async (t) => {
  await t.step("creates pattern", () => {
    expect(pathToPattern("foo/bar")).toEqual("/foo/bar");
  });

  await t.step("parses index routes", () => {
    expect(pathToPattern("foo/index")).toEqual("/foo");
  });

  await t.step("parses parameters", () => {
    expect(pathToPattern("foo/[name]")).toEqual("/foo/:name");
    expect(pathToPattern("foo/[name]/bar/[bob]")).toEqual(
      "/foo/:name/bar/:bob",
    );
  });

  await t.step("parses catchall", () => {
    expect(pathToPattern("foo/[...name]")).toEqual("/foo/:name*");
  });

  await t.step("parses multiple params in same part", () => {
    expect(pathToPattern("foo/[mod]@[version]")).toEqual("/foo/:mod@:version");
    expect(pathToPattern("foo/[bar].json")).toEqual("/foo/:bar.json");
    expect(pathToPattern("foo/foo[bar]")).toEqual("/foo/foo:bar");
  });

  await t.step("parses optional params", () => {
    expect(pathToPattern("foo/[[name]]")).toEqual("/foo{/:name}?");
    expect(pathToPattern("foo/[name]/[[bob]]")).toEqual("/foo/:name{/:bob}?");
    expect(pathToPattern("foo/[[name]]/bar")).toEqual("/foo{/:name}?/bar");
    expect(
      pathToPattern("foo/[[name]]/bar/[[bob]]"),
    ).toEqual(
      "/foo{/:name}?/bar{/:bob}?",
    );
  });

  await t.step("throws on invalid patterns", () => {
    expect(() => pathToPattern("foo/[foo][bar]")).toThrow();
    expect(() => pathToPattern("foo/foo]")).toThrow();
    expect(() => pathToPattern("foo/[foo]]")).toThrow();
    expect(() => pathToPattern("foo/foo-[[name]]-bar/baz")).toThrow();
    expect(() => pathToPattern("foo/[[name]]-bar/baz")).toThrow();
    expect(() => pathToPattern("foo/foo-[[name]]/baz")).toThrow();
    expect(() => pathToPattern("foo/foo-[[name]]")).toThrow();
    expect(() => pathToPattern("foo/[[name]]-bar")).toThrow();
  });

  await t.step("keep groups", () => {
    expect(pathToPattern("foo/(foo)/bar", { keepGroups: true })).toEqual(
      "/foo/(foo)/bar",
    );
  });
});

Deno.test("patternToSegments", () => {
  expect(patternToSegments("/", "")).toEqual([""]);
  expect(patternToSegments("/foo", "")).toEqual([""]);
  expect(patternToSegments("/foo/bar", "")).toEqual(["", "foo"]);

  expect(patternToSegments("/:foo", "")).toEqual([""]);
  expect(patternToSegments("/:foo/:bar", "")).toEqual(["", ":foo"]);
  expect(patternToSegments("/:foo-:bar/foo", "")).toEqual(["", ":foo-:bar"]);
  expect(patternToSegments("/foo/", "")).toEqual(["", "foo"]);

  expect(patternToSegments("/foo/bar", "", true)).toEqual(["", "foo", "bar"]);
});

Deno.test("mergePath", () => {
  expect(mergePath("", "/foo")).toEqual("/foo");
  expect(mergePath("/", "/foo")).toEqual("/foo");
  expect(mergePath("/foo/bar", "/")).toEqual("/foo/bar");
  expect(mergePath("/foo/bar", "/baz")).toEqual("/foo/bar/baz");
  expect(mergePath("*", "/baz")).toEqual("/baz");
  expect(mergePath("/*", "/baz")).toEqual("/baz");
  expect(mergePath("/foo", "*")).toEqual("/foo/*");
  expect(mergePath("/foo", "/*")).toEqual("/foo/*");
});
