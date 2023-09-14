import { assertEquals, assertStringIncludes } from "./deps.ts";
import { Status } from "../server.ts";
import {
  assertNotSelector,
  assertSelector,
  assertTextMany,
  assertTextMatch,
  fetchHtml,
  waitForStyle,
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

Deno.test("adds refresh script to html", async () => {
  await withFresh("./tests/fixture/dev.ts", async (address) => {
    const doc = await fetchHtml(address);
    assertSelector(doc, `script[src="/_frsh/refresh.js"]`);

    const res = await fetch(`${address}/_frsh/refresh.js`);
    assertEquals(
      res.headers.get("content-type"),
      "application/javascript; charset=utf-8",
    );
    await res.body?.cancel();
  });
});

Deno.test("preact/debug is active in dev mode", async () => {
  await withPageName(
    "./tests/fixture_render_error/dev.ts",
    async (page, address) => {
      // SSR error is shown
      const resp = await fetch(address);
      const text = await resp.text();
      assertEquals(resp.status, Status.InternalServerError);
      assertStringIncludes(text, "Objects are not valid as a child");

      await page.goto(address);

      // Error page is shown with error message
      const el = await page.waitForSelector(".frsh-error-page");
      const text2 = await page.evaluate((el) => el.textContent, el);
      assertStringIncludes(text2, "Objects are not valid as a child");
    },
  );
});

Deno.test("middleware destination internal", async () => {
  await withFresh("./tests/fixture/dev.ts", async (address) => {
    const resp = await fetch(`${address}/_frsh/refresh.js`);
    assertEquals(resp.headers.get("destination"), "internal");
    await resp.body?.cancel();
  });
});

Deno.test("warns when using hooks in server components", async (t) => {
  await withFresh("./tests/fixture/main.ts", async (address) => {
    await t.step("useState", async () => {
      const doc = await fetchHtml(`${address}/hooks-server/useState`);
      assertTextMatch(doc, "pre", /Hook "useState" cannot be used/);
    });

    await t.step("useReducer", async () => {
      const doc = await fetchHtml(`${address}/hooks-server/useReducer`);
      assertTextMatch(doc, "pre", /Hook "useReducer" cannot be used/);
    });

    // Valid
    await t.step("does not warn in island", async () => {
      const doc = await fetchHtml(`${address}/hooks-server/island`);
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
