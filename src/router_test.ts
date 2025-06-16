import { expect } from "@std/expect";
import { IS_PATTERN, pathToPattern, UrlPatternRouter } from "./router.ts";

Deno.test("IS_PATTERN", () => {
  expect(IS_PATTERN.test("/foo")).toEqual(false);
  expect(IS_PATTERN.test("/foo/bar/baz.jpg")).toEqual(false);
  expect(IS_PATTERN.test("/foo/:path")).toEqual(true);
  expect(IS_PATTERN.test("/foo/*")).toEqual(true);
  expect(IS_PATTERN.test("/foo{/bar}?")).toEqual(true);
  expect(IS_PATTERN.test("/foo/(\\d+)")).toEqual(true);
  expect(IS_PATTERN.test("/foo/(a)")).toEqual(true);
});

Deno.test("UrlPatternRouter - GET get first match", () => {
  const router = new UrlPatternRouter();
  const A = () => {};
  const B = () => {};
  const C = () => {};
  router.add("GET", "/", [A]);
  router.add("GET", "/", [B]);
  router.add("GET", "/", [C]);

  const res = router.match("GET", new URL("/", "http://localhost"));
  expect(res).toEqual({
    params: {},
    handlers: [[A]],
    methodMatch: true,
    pattern: "/",
    patternMatch: true,
  });
});

Deno.test("UrlPatternRouter - GET get matches with middlewares", () => {
  const router = new UrlPatternRouter();
  const A = () => {};
  const B = () => {};
  const C = () => {};
  router.add("ALL", "/*", [A]);
  router.add("ALL", "/*", [B]);
  router.add("GET", "/", [C]);

  const res = router.match("GET", new URL("/", "http://localhost"));
  expect(res).toEqual({
    params: {},
    handlers: [[A], [B], [C]],
    methodMatch: true,
    pattern: "/",
    patternMatch: true,
  });
});

Deno.test("UrlPatternRouter - GET get matches with middlewares A", () => {
  const router = new UrlPatternRouter();
  const A = () => {};
  const B = () => {};
  const C = () => {};
  const D = () => {};
  router.addMiddleware("/*", D);
  router.add("ALL", "/*", [A]);
  router.add("ALL", "/*", [B]);
  router.add("GET", "/", [C]);

  const res = router.match("GET", new URL("/", "http://localhost"));

  expect(res).toEqual({
    params: {},
    handlers: [[D], [A], [B], [C]],
    methodMatch: true,
    pattern: "/",
    patternMatch: true,
  });
});

Deno.test("UrlPatternRouter - GET get matches with middlewares B", () => {
  const router = new UrlPatternRouter();
  const A = () => {};
  const B = () => {};
  const C = () => {};
  const D = () => {};
  router.addMiddleware("/", D);
  router.add("ALL", "/*", [A]);
  router.add("ALL", "/*", [B]);
  router.add("GET", "/a/1", [C]);

  const res = router.match("GET", new URL("/a/1", "http://localhost"));

  expect(res).toEqual({
    params: {},
    handlers: [[A], [B], [C]],
    methodMatch: true,
    pattern: "/a/1",
    patternMatch: true,
  });
});

Deno.test("UrlPatternRouter - GET extract params", () => {
  const router = new UrlPatternRouter();
  const A = () => {};
  router.add("GET", new URLPattern({ pathname: "/:foo/:bar/c" }), [A]);

  let res = router.match("GET", new URL("/a/b/c", "http://localhost"));
  expect(res).toEqual({
    params: { foo: "a", bar: "b" },
    handlers: [[A]],
    methodMatch: true,
    pattern: "/:foo/:bar/c",
    patternMatch: true,
  });

  // Decode params
  res = router.match("GET", new URL("/a%20a/b/c", "http://localhost"));
  expect(res).toEqual({
    params: { foo: "a a", bar: "b" },
    handlers: [[A]],
    methodMatch: true,
    pattern: "/:foo/:bar/c",
    patternMatch: true,
  });
});

Deno.test("UrlPatternRouter - Wrong method match", () => {
  const router = new UrlPatternRouter();
  const A = () => {};
  router.add("GET", "/foo", [A]);

  const res = router.match("POST", new URL("/foo", "http://localhost"));
  expect(res).toEqual({
    params: {},
    handlers: [],
    methodMatch: false,
    pattern: "/foo",
    patternMatch: true,
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
    params: {},
    handlers: [[B]],
    methodMatch: true,
    pattern: "/foo",
    patternMatch: true,
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
    handlers: [[A]],
    methodMatch: true,
    pattern: "/books/:id",
    patternMatch: true,
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
});
