import { expect } from "@std/expect";
import { getOrCreateSegment, newSegment } from "./segments.ts";

Deno.test("findOrCreateSegment - root", () => {
  const root = newSegment("", null);
  const found = getOrCreateSegment(root, "", false);
  expect(found).toEqual(root);
});

Deno.test("findOrCreateSegment - /foo/bar", () => {
  const root = newSegment("", null);
  const found = getOrCreateSegment(root, "/foo/bar", false);
  expect(found).toEqual(root.children.get("foo"));
});

Deno.test("findOrCreateSegment - /:foo/bar/:baz", () => {
  const root = newSegment("", null);
  const found = getOrCreateSegment(root, "/:foo/bar/:baz", false);
  expect(found).toEqual(
    root.children.get(":foo")?.children.get("bar"),
  );
});

Deno.test("findOrCreateSegment - /foo/bar/", () => {
  const root = newSegment("", null);
  const found = getOrCreateSegment(root, "/foo/bar/", false);
  expect(found).toEqual(root.children.get("foo")?.children.get("bar"));
});

Deno.test("findOrCreateSegment - /foo/bar with last", () => {
  const root = newSegment("", null);
  const found = getOrCreateSegment(root, "/foo/bar", true);
  expect(found).toEqual(root.children.get("foo")?.children.get("bar"));
});
