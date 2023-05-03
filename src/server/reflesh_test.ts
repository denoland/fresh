import { assertEquals } from "https://deno.land/std@0.178.0/testing/asserts.ts";
import { refleshJs } from "./reflesh.ts";

Deno.test("minifyRefreshScript", () => {
  assertEquals(
    refleshJs("http://localhost:8000", "abc123"),
    `new EventSource("http://localhost:8000").addEventListener( "message", function listener(e) { if (e.data !== "abc123") { this.removeEventListener("message", listener); location.reload(); } } );`
  );
});
