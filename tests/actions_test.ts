import { assertEquals, Page } from "./deps.ts";
import { withPageName } from "./test_utils.ts";

function withPage(fn: (page: Page, address: string) => Promise<void>) {
  return withPageName("./tests/fixture_actions/main.ts", fn);
}

Deno.test({
  name: "action should be called on mount",
  async fn() {
    await withPage(async (page, address) => {
      await page.goto(`${address}/action_server`);
      await page.waitForSelector("#page");

      const text = await page.$eval("#page", (el) => el.textContent);
      assertEquals(text, "it works");
    });
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "action lifecycle should work inside island",
  async fn() {
    await withPage(async (page, address) => {
      await page.goto(`${address}/action_island`);
      await page.waitForSelector("#out");

      const text = await page.$eval("#out", (el) => el.textContent);
      assertEquals(text, "mount:it works");

      await page.click("button");
      const text2 = await page.$eval("#out", (el) => el.textContent);
      assertEquals(text2, "mount:it works update:it works");

      await page.click("button");
      const text3 = await page.$eval("#out", (el) => el.textContent);
      assertEquals(text3, "mount:it works update:it works update:it works");

      await page.click("button");
      const text4 = await page.$eval("#out", (el) => el.textContent);
      assertEquals(
        text4,
        "mount:it works update:it works update:it works destroy: done",
      );
    });
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "action revived in island slots",
  async fn() {
    await withPage(async (page, address) => {
      await page.goto(`${address}/action_slot`);
      await page.waitForSelector("#page");

      const text = await page.$eval("p", (el) => el.textContent);
      assertEquals(text, "it works");
      const body = await page.$eval("body", (el) => el.className);
      assertEquals(body, "action-hello2");

      await page.click("button");
      const body2 = await page.$eval("body", (el) => el.className);
      assertEquals(body2, "");
    });
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "revive multiple server actions",
  async fn() {
    await withPage(async (page, address) => {
      await page.goto(`${address}/action_slot_multiple`);
      await page.waitForSelector("#page");

      const text = await page.$eval("p", (el) => el.textContent);
      assertEquals(text, "multi_1,multi_2");

      const body = await page.$eval("body", (el) => el.className);
      assertEquals(body, "multi_1 multi_2");

      await page.click("button");
      const body2 = await page.$eval("body", (el) => el.className);
      assertEquals(body2, "");
    });
  },

  sanitizeOps: false,
  sanitizeResources: false,
});
