import { assertEquals } from "./deps.ts";
import { withPageName } from "./test_utils.ts";

Deno.test({
  name: "render async server component",

  async fn(_t) {
    await withPageName(
      "./tests/fixture_server_components/main.ts",
      async (page, address) => {
        await page.goto(`${address}/basic`);

        await page.waitForSelector("h1");
        const text = await page.$eval("h1", (el) => el.textContent);
        assertEquals(text, "it works");
      },
    );
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "uses returned response",

  async fn(_t) {
    await withPageName(
      "./tests/fixture_server_components/main.ts",
      async (page, address) => {
        await page.goto(`${address}/response`);

        const text = await page.$eval("body", (el) => el.textContent);
        assertEquals(text, "it works");
      },
    );
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "revives islands in async server component",

  async fn(_t) {
    await withPageName(
      "./tests/fixture_server_components/main.ts",
      async (page, address) => {
        await page.goto(`${address}/island`);

        await page.waitForSelector("button");
        let text = await page.$eval("button", (el) => el.textContent);
        assertEquals(text, "update 0");

        await page.click("button");
        text = await page.$eval("button", (el) => el.textContent);
        assertEquals(text, "update 1");
      },
    );
  },

  sanitizeOps: false,
  sanitizeResources: false,
});
