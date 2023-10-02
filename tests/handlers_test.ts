import { assertEquals, assertMatch } from "$std/testing/asserts.ts";
import { assertTextMany, withFakeServe } from "./test_utils.ts";

Deno.test("POST handler can render JSX", async () => {
  await withFakeServe(
    "./tests/fixture_handler_render/main.ts",
    async (server) => {
      const doc = await server.postHtml("/render_jsx");
      assertTextMany(doc, "h1", ["POST: it works"]);
    },
  );
});

Deno.test("PATCH handler can render JSX", async () => {
  await withFakeServe(
    "./tests/fixture_handler_render/main.ts",
    async (server) => {
      const doc = await server.patchHtml("/render_jsx");
      assertTextMany(doc, "h1", ["PATCH: it works"]);
    },
  );
});

Deno.test("PUT handler can render JSX", async () => {
  await withFakeServe(
    "./tests/fixture_handler_render/main.ts",
    async (server) => {
      const doc = await server.putHtml("/render_jsx");
      assertTextMany(doc, "h1", ["PUT: it works"]);
    },
  );
});

Deno.test("DELETE handler can render JSX", async () => {
  await withFakeServe(
    "./tests/fixture_handler_render/main.ts",
    async (server) => {
      const doc = await server.deleteHtml("/render_jsx");
      assertTextMany(doc, "h1", ["DELETE: it works"]);
    },
  );
});
