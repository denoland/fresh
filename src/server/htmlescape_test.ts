import { htmlEscapeJsonString } from "./htmlescape.ts";
import { assertEquals } from "../../tests/deps.ts";

Deno.test("with angle brackets should escape", () => {
  const evilObj = { evil: "<script></script>" };
  assertEquals(
    htmlEscapeJsonString(JSON.stringify(evilObj)),
    '{"evil":"\\u003cscript\\u003e\\u003c/script\\u003e"}',
  );
});

Deno.test("with angle brackets should parse back", () => {
  const evilObj = { evil: "<script></script>" };
  assertEquals(
    JSON.parse(htmlEscapeJsonString(JSON.stringify(evilObj))),
    evilObj,
  );
});
