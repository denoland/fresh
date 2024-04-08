import { assertEquals } from "./deps.ts";
import { IS_PATTERN } from "./router.ts";

Deno.test("IS_PATTERN", () => {
  assertEquals(IS_PATTERN.test("/foo"), false);
  assertEquals(IS_PATTERN.test("/foo/bar/baz.jpg"), false);
  assertEquals(IS_PATTERN.test("/foo/:path"), true);
  assertEquals(IS_PATTERN.test("/foo/*"), true);
  assertEquals(IS_PATTERN.test("/foo{/bar}?"), true);
  assertEquals(IS_PATTERN.test("/foo/(\\d+)"), true);
  assertEquals(IS_PATTERN.test("/foo/(a)"), true);
});
