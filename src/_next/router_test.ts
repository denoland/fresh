import { expect } from "jsr:@std/expect";
import {
  IS_PATTERN,
  pathToPattern,
  sortRoutePaths,
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

Deno.test("UrlPatternRouter - GET get first match", () => {
  const router = new UrlPatternRouter();
  const A = () => {};
  const B = () => {};
  const C = () => {};
  router.add({ path: "/", method: "GET", handler: A });
  router.add({ path: "/", method: "GET", handler: B });
  router.add({ path: "/", method: "GET", handler: C });

  const res = router.match("GET", new URL("/", "http://localhost"));
  expect(res).toEqual({
    params: {},
    handlers: [A],
    methodMatch: true,
    patternMatch: true,
  });
});

Deno.test("UrlPatternRouter - GET get matches with middlewares", () => {
  const router = new UrlPatternRouter();
  const A = () => {};
  const B = () => {};
  const C = () => {};
  router.add({ path: "*", method: "ALL", handler: A });
  router.add({ path: "*", method: "ALL", handler: B });
  router.add({ path: "/", method: "GET", handler: C });

  const res = router.match("GET", new URL("/", "http://localhost"));
  expect(res).toEqual({
    params: {},
    handlers: [A, B, C],
    methodMatch: true,
    patternMatch: true,
  });
});

Deno.test("UrlPatternRouter - GET extract params", () => {
  const router = new UrlPatternRouter();
  const A = () => {};
  router.add({
    path: new URLPattern({ pathname: "/:foo/:bar/c" }),
    method: "GET",
    handler: A,
  });

  let res = router.match("GET", new URL("/a/b/c", "http://localhost"));
  expect(res).toEqual({
    params: { foo: "a", bar: "b" },
    handlers: [A],
    methodMatch: true,
    patternMatch: true,
  });

  // Decode params
  res = router.match("GET", new URL("/a%20a/b/c", "http://localhost"));
  expect(res).toEqual({
    params: { foo: "a a", bar: "b" },
    handlers: [A],
    methodMatch: true,
    patternMatch: true,
  });
});

Deno.test("UrlPatternRouter - Wrong method match", () => {
  const router = new UrlPatternRouter();
  const A = () => {};
  router.add({
    path: "/foo",
    method: "GET",
    handler: A,
  });

  const res = router.match("POST", new URL("/foo", "http://localhost"));
  expect(res).toEqual({
    params: {},
    handlers: [],
    methodMatch: false,
    patternMatch: true,
  });
});

Deno.test("UrlPatternRouter - wrong + correct method", () => {
  const router = new UrlPatternRouter();
  const A = () => {};
  const B = () => {};
  router.add({
    path: "/foo",
    method: "GET",
    handler: A,
  });
  router.add({
    path: "/foo",
    method: "POST",
    handler: B,
  });

  const res = router.match("POST", new URL("/foo", "http://localhost"));
  expect(res).toEqual({
    params: {},
    handlers: [B],
    methodMatch: true,
    patternMatch: true,
  });
});

Deno.test("UrlPatternRouter - convert patterns automatically", () => {
  const router = new UrlPatternRouter();
  const A = () => {};
  router.add({
    path: "/books/:id",
    method: "GET",
    handler: A,
  });

  const res = router.match("GET", new URL("/books/foo", "http://localhost"));
  expect(res).toEqual({
    params: {
      id: "foo",
    },
    handlers: [A],
    methodMatch: true,
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

Deno.test("sortRoutePaths", () => {
  let routes = [
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
  let sorted = [
    "/foo/_middleware",
    "/foo/_layout",
    "/foo/index",
    "/foo/bar/_middleware",
    "/foo/bar/_layout",
    "/foo/bar/index",
    "/foo/bar/baz",
    "/foo/bar/[...foo]",
    "/foo/bar",
    "/foo/[id]",
    "/foo/[...slug]",
  ];
  routes.sort(sortRoutePaths);
  expect(routes).toEqual(sorted);

  routes = [
    "/js/index.js",
    "/js/_layout.js",
    "/jsx/index.jsx",
    "/jsx/_layout.jsx",
    "/ts/index.ts",
    "/ts/_layout.tsx",
    "/tsx/index.tsx",
    "/tsx/_layout.tsx",
  ];
  routes.sort(sortRoutePaths);
  sorted = [
    "/js/_layout.js",
    "/js/index.js",
    "/jsx/_layout.jsx",
    "/jsx/index.jsx",
    "/ts/_layout.tsx",
    "/ts/index.ts",
    "/tsx/_layout.tsx",
    "/tsx/index.tsx",
  ];
  expect(routes).toEqual(sorted);
});
