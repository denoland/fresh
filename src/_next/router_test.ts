import { expect } from "jsr:@std/expect";
import { IS_PATTERN, UrlPatternRouter } from "./router.ts";

Deno.test("IS_PATTERN", () => {
  expect(IS_PATTERN.test("/foo")).toEqual(false);
  expect(IS_PATTERN.test("/foo/bar/baz.jpg")).toEqual(false);
  expect(IS_PATTERN.test("/foo/:path")).toEqual(true);
  expect(IS_PATTERN.test("/foo/*")).toEqual(true);
  expect(IS_PATTERN.test("/foo{/bar}?")).toEqual(true);
  expect(IS_PATTERN.test("/foo/(\\d+)")).toEqual(true);
  expect(IS_PATTERN.test("/foo/(a)")).toEqual(true);
});

Deno.test("UrlPatternRouter - GET chain routes", () => {
  const router = new UrlPatternRouter();
  const A = () => {};
  const B = () => {};
  const C = () => {};
  router.add({ path: "/", method: "GET", handler: A });
  router.add({ path: "/", method: "GET", handler: B });
  router.add({ path: "/", method: "GET", handler: C });

  const res = router.match("GET", new URL("/", "http://localhost"));
  expect(res).toEqual({ params: {}, handlers: [A, B, C], methodMatch: true });
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
  });

  // Decode params
  res = router.match("GET", new URL("/a%20a/b/c", "http://localhost"));
  expect(res).toEqual({
    params: { foo: "a a", bar: "b" },
    handlers: [A],
    methodMatch: true,
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
  });
});
