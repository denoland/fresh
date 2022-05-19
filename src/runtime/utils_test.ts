import { assertEquals } from "../../tests/deps.ts";
import { asset, assetSrcSet } from "./utils.ts";

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

Deno.test("assetSrcSet", () => {
  assertEquals(assetSrcSet("/img.png"), "/img.png?__frsh_c=ID123");
  assertEquals(
    assetSrcSet("/img.png, /img.png 2x"),
    "/img.png?__frsh_c=ID123, /img.png?__frsh_c=ID123 2x",
  );
  assertEquals(assetSrcSet("/img.png 1x"), "/img.png?__frsh_c=ID123 1x");
  assertEquals(
    assetSrcSet("/img.png 1x, /img.png 2x"),
    "/img.png?__frsh_c=ID123 1x, /img.png?__frsh_c=ID123 2x",
  );
  assertEquals(
    assetSrcSet("/img.png 1.5x, /img.png 3x"),
    "/img.png?__frsh_c=ID123 1.5x, /img.png?__frsh_c=ID123 3x",
  );

  //test with queries
  assertEquals(
    assetSrcSet("/img.png?w=140, /img.png?w=200 2x"),
    "/img.png?w=140&__frsh_c=ID123, /img.png?w=200&__frsh_c=ID123 2x",
  );

  // test with extra spaces
  assertEquals(
    assetSrcSet("/img-s.png 300w,  /img-l.png  600w , /img-xl.png  900w"),
    "/img-s.png?__frsh_c=ID123 300w,  /img-l.png?__frsh_c=ID123  600w , /img-xl.png?__frsh_c=ID123  900w",
  );

  // test with ( syntax
  assertEquals(
    assetSrcSet("/img.png ( 140,0w)"),
    "/img.png ( 140,0w)",
  );

  // test with invalid parts
  assertEquals(
    assetSrcSet("/img.png,, /img-s.png 300w"),
    "/img.png,, /img-s.png 300w",
  );
});
