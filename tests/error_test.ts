import { Status } from "../server.ts";
import { assertEquals, assertStringIncludes } from "./deps.ts";
import { getErrorOverlay, withFakeServe } from "./test_utils.ts";

Deno.test("error page rendered", async () => {
  await withFakeServe("./tests/fixture_error/dev.ts", async (server) => {
    const resp = await server.get("/");
    assertEquals(resp.status, Status.InternalServerError);
    assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
    await resp.text(); // Consume

    const { title, stack } = await getErrorOverlay(server, "/");
    assertStringIncludes(title, `boom!`);
    assertStringIncludes(stack, `at render`);
  });
});
