import { assertEquals } from "../../tests/deps.ts";
import { sortRoutePaths } from "./context.ts";

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
