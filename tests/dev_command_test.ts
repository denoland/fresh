import { assertEquals, assertStringIncludes } from "./deps.ts";
import { Status } from "../server.ts";
import {
  assertNotSelector,
  assertSelector,
  assertTextMany,
  assertTextMatch,
  fetchHtml,
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

Deno.test({
  name: "dev_command config: shows codeframe",
  async fn() {
    await withFakeServe(
      "./tests/fixture_dev_config/dev.ts",
      async (server) => {
        const doc = await server.getHtml("/codeframe");
        assertSelector(doc, ".frsh-error-page");
        assertSelector(doc, ".code-frame");
      },
    );
  },
});

Deno.test({
  name: "dev_command legacy",
  async fn() {
    await withPageName(
      "./tests/fixture_dev_legacy/main.ts",
      async (page, address) => {
        await page.goto(`${address}`);
        await waitForStyle(page, "h1", "color", "rgb(220, 38, 38)");
      },
    );
  },
});

Deno.test({
  name: "dev_command legacy: shows codeframe",
  async fn() {
    await withFakeServe(
      "./tests/fixture_dev_legacy/dev.ts",
      async (server) => {
        const doc = await server.getHtml("/codeframe");
        assertSelector(doc, ".frsh-error-page");
        assertSelector(doc, ".code-frame");
      },
    );
  },
});

Deno.test("adds refresh script to html", async () => {
  await withFakeServe("./tests/fixture/dev.ts", async (server) => {
    const doc = await server.getHtml("/");
    assertSelector(doc, `script[src="/_frsh/refresh.js"]`);

    const res = await server.get(`/_frsh/refresh.js`);
    assertEquals(
      res.headers.get("content-type"),
      "application/javascript; charset=utf-8",
    );
    await res.body?.cancel();
  });
});

Deno.test("preact/debug is active in dev mode", async () => {
  await withFakeServe(
    "./tests/fixture_render_error/dev.ts",
    async (server) => {
      // SSR error is shown
      const resp = await server.get("/");
      const text = await resp.text();
      assertEquals(resp.status, Status.InternalServerError);
      assertStringIncludes(text, "Objects are not valid as a child");

      const html = await server.getHtml("/");

      // Error page is shown with error message
      const text2 = html.querySelector(".frsh-error-page")!.textContent!;
      assertStringIncludes(text2, "Objects are not valid as a child");
    },
  );
});

Deno.test("middleware destination internal", async () => {
  await withFakeServe("./tests/fixture/dev.ts", async (server) => {
    const resp = await server.get(`/_frsh/refresh.js`);
    assertEquals(resp.headers.get("destination"), "internal");
    await resp.body?.cancel();
  });
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
      const doc = await server.getHtml(`/`);
      assertSelector(doc, ".frsh-error-page");
    },
  );

  await withFakeServe(
    "./tests/fixture_dev_codeframe/main.ts",
    async (server) => {
      const doc = await server.getHtml(`/`);
      assertNotSelector(doc, ".frsh-error-page");
      assertSelector(doc, "h1");
    },
  );
});
