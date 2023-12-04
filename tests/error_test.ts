import { STATUS_CODE } from "../server.ts";
import {
  assertEquals,
  AssertionError,
  assertRejects,
  assertStringIncludes,
} from "./deps.ts";
import { getErrorOverlay, withFakeServe } from "./test_utils.ts";

Deno.test("error page rendered", async () => {
  await withFakeServe("./tests/fixture_error/dev.ts", async (server) => {
    const resp = await server.get("/");
    assertEquals(resp.status, STATUS_CODE.InternalServerError);
    assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
    const body = await resp.text();
    assertStringIncludes(body, "<p>500 page</p>");

    const { title, stack } = await getErrorOverlay(server, "/");
    assertStringIncludes(title, `boom!`);
    assertStringIncludes(stack, `at render`);
  });
});

Deno.test("error page rendered without error overlay", async () => {
  await withFakeServe("./tests/fixture_error/main.ts", async (server) => {
    const resp = await server.get("/");
    assertEquals(resp.status, STATUS_CODE.InternalServerError);
    assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
    const body = await resp.text();
    assertStringIncludes(body, "<p>500 page</p>");

    await assertRejects(
      () => getErrorOverlay(server, "/"),
      AssertionError,
      undefined,
      "Missing fresh error overlay",
    );
  });
});
