import { assertEquals } from "../../tests/deps.ts";
import { asset } from "./utils.ts";

globalThis.__FRSH_BUILD_ID = "ID123";

Deno.test("asset", () => {
  assertEquals(asset("/test.png"), "/test.png?__frsh_c=ID123");
  assertEquals(asset("/test?f=1"), "/test?f=1&__frsh_c=ID123");
  assertEquals(asset("/test#foo"), "/test?__frsh_c=ID123#foo");
  assertEquals(asset("/test?f=1#foo"), "/test?f=1&__frsh_c=ID123#foo");

  assertEquals(asset("./test.png"), "./test.png");
  assertEquals(asset("//example.com/logo.png"), "//example.com/logo.png");
  assertEquals(asset("/test.png?__frsh_c=1"), "/test.png?__frsh_c=1");
  assertEquals(
    asset("https://example.com/logo.png"),
    "https://example.com/logo.png",
  );
});
