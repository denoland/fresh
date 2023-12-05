import { assert, assertEquals, assertStringIncludes } from "./deps.ts";
import { STATUS_CODE } from "../server.ts";
import {
  assertNotSelector,
  assertTextMany,
  assertTextMatch,
  fetchHtml,
  getErrorOverlay,
  waitForStyle,
  withFakeServe,
  withFresh,
  withPageName,
} from "./test_utils.ts";

Deno.test({
  name: "dev_command config",
  async fn() {
    await withPageName(
      "./tests/fixture_dev_config/main.ts",
      async (page, address) => {
        await page.goto(`${address}`);
        await waitForStyle(page, "h1", "color", "rgb(220, 38, 38)");
      },
    );
  },
});

Deno.test("dev_command config: shows codeframe", async () => {
  await withFakeServe(
    "./tests/fixture_dev_config/dev.ts",
    async (server) => {
      const { codeFrame } = await getErrorOverlay(server, "/codeframe");
      assert(codeFrame);
    },
  );
});

Deno.test("dev_command legacy", async () => {
  await withPageName(
    "./tests/fixture_dev_legacy/main.ts",
    async (page, address) => {
      await page.goto(`${address}`);
      await waitForStyle(page, "h1", "color", "rgb(220, 38, 38)");
    },
  );
});

Deno.test("dev_command legacy: shows codeframe", async () => {
  await withFakeServe(
    "./tests/fixture_dev_legacy/dev.ts",
    async (server) => {
      const { codeFrame } = await getErrorOverlay(server, "/codeframe");
      assert(codeFrame);
    },
  );
});

Deno.test("preact/debug is active in dev mode", async () => {
  await withFakeServe(
    "./tests/fixture_render_error/dev.ts",
    async (server) => {
      // SSR error is shown
      const resp = await server.get("/");
      await resp.text(); // Consume
      assertEquals(resp.status, STATUS_CODE.InternalServerError);

      const { title } = await getErrorOverlay(server, "/");
      assertStringIncludes(title, "Objects are not valid as a child");
    },
  );
});

Deno.test("warns when using hooks in server components", async (t) => {
  await withFakeServe("./tests/fixture/main.ts", async (server) => {
    await t.step("useState", async () => {
      const doc = await server.getHtml(`/hooks-server/useState`);
      assertTextMatch(doc, "p", /Hook "useState" cannot be used/);
      // Check for hint
      assertTextMatch(doc, "p", /Instead, use the "useSignal" hook/);
    });

    await t.step("useReducer", async () => {
      const doc = await server.getHtml(`/hooks-server/useReducer`);
      assertTextMatch(doc, "p", /Hook "useReducer" cannot be used/);
    });

    // Valid
    await t.step("does not warn in island", async () => {
      const doc = await server.getHtml(`/hooks-server/island`);
      assertTextMany(doc, "p", ["0"]);
    });
  });
});

Deno.test("shows custom 500 page for rendering errors when not in dev", async (t) => {
  await withFresh({
    name: "./tests/fixture/main.ts",
    options: {
      env: {
        DENO_DEPLOYMENT_ID: "foo",
      },
    },
  }, async (address) => {
    await t.step("useState", async () => {
      const doc = await fetchHtml(`${address}/hooks-server/useState`);
      assertNotSelector(doc, "pre");
    });

    await t.step("useReducer", async () => {
      const doc = await fetchHtml(`${address}/hooks-server/useReducer`);
      assertNotSelector(doc, "pre");
    });
  });
});

Deno.test("show codeframe in dev mode even with custom 500", async () => {
  await withFakeServe(
    "./tests/fixture_dev_codeframe/dev.ts",
    async (server) => {
      const { title } = await getErrorOverlay(server, "/");
      assertEquals(title, "fail");
    },
  );

  await withFakeServe(
    "./tests/fixture_dev_codeframe/main.ts",
    async (server) => {
      const doc = await server.getHtml("/");
      assertNotSelector(doc, "#fresh-error-overlay");
    },
  );
});

Deno.test("serve client script source map", async () => {
  await withFakeServe(
    "./tests/fixture/dev.ts",
    async (server) => {
      const res = await server.get(`/_frsh/fresh_dev_client.js`);
      await res.text(); // Consume body
      assertEquals(res.status, 200);
      assertEquals(
        res.headers.get("Content-Type"),
        "application/javascript; charset=UTF-8",
      );

      const res2 = await server.get(`/_frsh/fresh_dev_client.js.map`);
      const json = await res2.json();
      assertEquals(res2.status, 200);
      assertEquals(
        res2.headers.get("Content-Type"),
        "application/json; charset=UTF-8",
      );
      assert(typeof json.mappings, "string");
    },
  );
});
