import { expect } from "@std/expect";
import { App } from "fresh";
import { applyBasePath } from "../src/runtime/shared_internal.ts";

Deno.test("basePath validation - rejects invalid paths", () => {
  expect(() => new App({ basePath: "invalid" })).toThrow(
    'Invalid basePath: "invalid". Must be empty, "/", "./", or start with "/"',
  );

  expect(() => new App({ basePath: "/ui/" })).toThrow(
    'Invalid basePath: "/ui/". Must not end with "/" except for root path',
  );

  expect(() => new App({ basePath: "/ui@admin" })).toThrow(
    'Invalid basePath: "/ui@admin". Contains invalid characters',
  );

  expect(() => new App({ basePath: "/ui admin" })).toThrow(
    'Invalid basePath: "/ui admin". Contains invalid characters',
  );
});

Deno.test("basePath validation - accepts valid paths", () => {
  expect(() => new App({ basePath: "" })).not.toThrow();
  expect(() => new App({ basePath: "/" })).not.toThrow();
  expect(() => new App({ basePath: "./" })).not.toThrow();
  expect(() => new App({ basePath: "/ui" })).not.toThrow();
  expect(() => new App({ basePath: "/api/v1" })).not.toThrow();
  expect(() => new App({ basePath: "/ui-admin" })).not.toThrow();
  expect(() => new App({ basePath: "/ui.test" })).not.toThrow();
  expect(() => new App({ basePath: "/deep/nested/path" })).not.toThrow();
});
Deno.test("applyBasePath - no basePath", () => {
  expect(applyBasePath("/test", undefined)).toBe("/test");
  expect(applyBasePath("/test", "")).toBe("/test");
  expect(applyBasePath("/test", "/")).toBe("/test");
});

Deno.test("applyBasePath - relative paths not affected", () => {
  expect(applyBasePath("test", "/ui")).toBe("test");
  expect(applyBasePath("./test", "/ui")).toBe("./test");
  expect(applyBasePath("../test", "/ui")).toBe("../test");
});

Deno.test("applyBasePath - absolute basePath", () => {
  expect(applyBasePath("/test", "/ui")).toBe("/ui/test");
  expect(applyBasePath("/api/users", "/ui")).toBe("/ui/api/users");
  expect(applyBasePath("/", "/ui")).toBe("/ui/");
});

Deno.test("applyBasePath - relative basePath", () => {
  expect(applyBasePath("/test", "./")).toBe("./test");
  expect(applyBasePath("/api/users", "./")).toBe("./api/users");
  expect(applyBasePath("/", "./")).toBe("./");
});

Deno.test("applyBasePath - complex paths", () => {
  expect(applyBasePath("/api/v1/users", "/app")).toBe("/app/api/v1/users");
  expect(applyBasePath("/assets/style.css", "/ui/admin")).toBe(
    "/ui/admin/assets/style.css",
  );
});

Deno.test("applyBasePath - non-absolute paths", () => {
  expect(applyBasePath("http://example.com/test", "/ui")).toBe(
    "http://example.com/test",
  );
  expect(applyBasePath("//cdn.example.com/test", "/ui")).toBe(
    "//cdn.example.com/test",
  );
  expect(applyBasePath("relative/path", "/ui")).toBe("relative/path");
});
