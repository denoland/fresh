import { waitForText, withPageName } from "./test_utils.ts";

Deno.test({
  name: "serializes shared signal references",
  async fn() {
    await withPageName("./tests/fixture/main.ts", async (page, address) => {
      await page.goto(`${address}/signal_shared`);
      await page.waitForSelector("#counter-1");

      await page.click("#b-counter-1");
      await waitForText(page, "#counter-1 p", "2");
      await waitForText(page, "#counter-2 p", "2");

      await page.click("#b-counter-2");
      await waitForText(page, "#counter-1 p", "3");
      await waitForText(page, "#counter-2 p", "3");
    });
  },
});
