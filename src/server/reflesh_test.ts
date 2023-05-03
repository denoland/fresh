import { assertEquals } from "https://deno.land/std@0.178.0/testing/asserts.ts";
import { refleshJs } from "./reflesh.ts";

Deno.test("minifyRefreshScript", () => {
  assertEquals(
    refleshJs("http://localhost:8000", "abc123"),
    `let es = new EventSource("http://localhost:8000"); window.addEventListener("beforeunload", (event) => { es.close(); }); es.addEventListener("message", function listener(e) { if (e.data !== "abc123") { this.removeEventListener("message", listener); location.reload(); } });`
  );
});
