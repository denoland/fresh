import { assertEquals } from "$std/testing/asserts.ts";
import { delay } from "$std/async/delay.ts";
import { startFreshServer } from "../tests/test_utils.ts";

Deno.test("CORS should not set on GET /fresh-badge.svg", {
  sanitizeResources: false,
}, async () => {
  const { serverProcess, lines } = await startFreshServer({
    args: ["run", "-A", "./main.ts"],
  });

  const res = await fetch("http://localhost:8000/fresh-badge.svg");
  await res.body?.cancel();

  assertEquals(res.headers.get("cross-origin-resource-policy"), null);

  await lines.cancel();
  serverProcess.kill("SIGTERM");
  // await for the server to close
  await delay(100);
});
