import { expect } from "@std/expect/expect";
import { generateFilePaths, validateArgs, validateUrl } from "./screenshot.ts";

Deno.test("validateArgs - accepts 2 arguments", () => {
  const result = validateArgs(["https://example.com", "test-id"]);
  expect(result).toEqual(["https://example.com", "test-id"]);
});

Deno.test("validateArgs - should throw error for incorrect number of arguments", () => {
  expect(() => validateArgs(["only-one"])).toThrow(
    "Usage: screenshot <url> <id>",
  );
  expect(() => validateArgs(["one", "two", "three"])).toThrow(
    "Usage: screenshot <url> <id>",
  );
});

Deno.test("validateUrl - should accept valid HTTP URLs", () => {
  const url = validateUrl("http://example.com");
  expect(url).toEqual(new URL("http://example.com"));
});

Deno.test("validateUrl - should accept valid HTTPS URLs", () => {
  const url = validateUrl("https://example.com");
  expect(url).toEqual(new URL("https://example.com"));
});

Deno.test("validateUrl - should reject invalid protocols", () => {
  expect(() => validateUrl("ftp://example.com")).toThrow("Invalid URL");
  expect(() => validateUrl("file:///path/to/file")).toThrow("Invalid URL");
});

Deno.test("generateFilePaths - should generate correct file paths", () => {
  const paths = generateFilePaths("test-id");
  expect(paths).toEqual({
    image2x: "./www/static/showcase/test-id2x.jpg",
    image1x: "./www/static/showcase/test-id1x.jpg",
  });
});

Deno.test("generateFilePaths - should handle special characters in ID", () => {
  const paths = generateFilePaths("test-id_123");
  expect(paths).toEqual({
    image2x: "./www/static/showcase/test-id_1232x.jpg",
    image1x: "./www/static/showcase/test-id_1231x.jpg",
  });
});
