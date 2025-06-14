import { assertEquals, assertThrows } from "@std/assert";
import { generateFilePaths, validateArgs, validateUrl } from "./screenshot.ts";

Deno.test("validateArgs - accepts 2 arguments", () => {
  const result = validateArgs(["https://example.com", "test-id"]);
  assertEquals(result, ["https://example.com", "test-id"]);
});

Deno.test("validateArgs - should throw error for incorrect number of arguments", () => {
  assertThrows(
    () => validateArgs(["only-one"]),
    Error,
    "Usage: screenshot <url> <id>",
  );
  assertThrows(
    () => validateArgs(["one", "two", "three"]),
    Error,
    "Usage: screenshot <url> <id>",
  );
});

Deno.test("validateUrl - should accept valid HTTP URLs", () => {
  const url = validateUrl("http://example.com");
  assertEquals(url.protocol, "http:");
  assertEquals(url.hostname, "example.com");
});

Deno.test("validateUrl - should accept valid HTTPS URLs", () => {
  const url = validateUrl("https://example.com");
  assertEquals(url.protocol, "https:");
  assertEquals(url.hostname, "example.com");
});

Deno.test("validateUrl - should reject invalid protocols", () => {
  assertThrows(() => validateUrl("ftp://example.com"), Error, "Invalid URL");
  assertThrows(() => validateUrl("file:///path/to/file"), Error, "Invalid URL");
});

Deno.test("generateFilePaths - should generate correct file paths", () => {
  const paths = generateFilePaths("test-id");
  assertEquals(paths.image2x, "./www/static/showcase/test-id2x.jpg");
  assertEquals(paths.image1x, "./www/static/showcase/test-id1x.jpg");
});

Deno.test("generateFilePaths - should handle special characters in ID", () => {
  const paths = generateFilePaths("test-id_123");
  assertEquals(paths.image2x, "./www/static/showcase/test-id_1232x.jpg");
  assertEquals(paths.image1x, "./www/static/showcase/test-id_1231x.jpg");
});
