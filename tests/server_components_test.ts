import { assertEquals } from "./deps.ts";
import { withPageName } from "./test_utils.ts";

Deno.test({
  name: "render async server component",

  async fn(_t) {
    await withPageName(
      "./tests/fixture_server_components/main.ts",
      async (page, address) => {
        await page.goto(address);

        await page.waitForSelector("h1");
        const text = await page.$eval("h1", (el) => el.textContent);
        assertEquals(text, "it works");
      },
    );
  },

  sanitizeOps: false,
  sanitizeResources: false,
});
