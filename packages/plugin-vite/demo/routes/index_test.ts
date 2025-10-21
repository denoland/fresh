import { assertEquals } from "@std/assert";

// This test file should NOT be bundled into production builds
Deno.test("index route test", () => {
  assertEquals(1 + 1, 2);
});
