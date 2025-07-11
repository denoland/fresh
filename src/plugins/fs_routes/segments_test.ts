import { expect } from "@std/expect";
import { findOrCreateSegment, newSegment } from "./segments.ts";

Deno.test("findOrCreateSegment - root", () => {
  const root = newSegment("", null);
  const found = findOrCreateSegment(root, "");
  expect(found).toEqual(root);
});

Deno.test("findOrCreateSegment - /foo/bar", () => {
  const root = newSegment("", null);
  const found = findOrCreateSegment(root, "/foo/bar");
  expect(found).toEqual(root.children.get("foo")?.children.get("bar"));
});

Deno.test("findOrCreateSegment - /:foo/bar/:baz", () => {
  const root = newSegment("", null);
  const found = findOrCreateSegment(root, "/:foo/bar/:baz");
  expect(found).toEqual(
    root.children.get(":foo")?.children.get("bar")?.children.get(":baz"),
  );
});
