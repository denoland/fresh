import { createHandler } from "$fresh/server.ts";
import manifest from "../fresh.gen.ts";
import { assertEquals,assertExists } from "$std/testing/asserts.ts";
import type { ConnInfo } from "../../../src/server/deps.ts";

const CONN_INFO: ConnInfo = {
  localAddr: { hostname: "127.0.0.1", port: 8000, transport: "tcp" },
  remoteAddr: { hostname: "127.0.0.1", port: 53496, transport: "tcp" },
};

Deno.test("HTTP assert test.", async (t) => {
  await t.step("#1 GET /", async () => {
    const handler = await createHandler(manifest);
    const response = await handler(new Request("http://127.0.0.1/"), CONN_INFO);

    assertEquals(response.status, 200);
  });

  await t.step("#2 POST /", async () => {
    const handler = await createHandler(manifest);

    const formData = new FormData();
    formData.append("text", "Deno!");

    const request = new Request("http://127.0.0.1/", {
      method: "POST",
      body: formData,
    });

    const response = await handler(request, CONN_INFO);

    assertEquals(response.status, 303);
  });

  await t.step("#3 GET /foo", async () => {
    const handler = await createHandler(manifest);

    const request = new Request("http://127.0.0.1/foo");

    const response = await handler(request, CONN_INFO);
    const text = await response.text();

    assertExists(text.match(/<div>Hello Foo!<\/div>/))
  });


  await t.step("#4 GET /foo/bar", async () => {
    const handler = await createHandler(manifest);

    const request = new Request("http://127.0.0.1/foo/bar");

    const response = await handler(request, CONN_INFO);

    assertEquals(response.status, 404);
  });
});
