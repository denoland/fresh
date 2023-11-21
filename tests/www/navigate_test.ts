import { waitForText, withPageName } from "$fresh/tests/test_utils.ts";

Deno.test("www - docs navigation", async () => {
  await withPageName("./www/main.ts", async (page, address) => {
    const logs: string[] = [];
    page.on("console", (msg) => logs.push(msg.text()));
    await page.goto(`${address}`, { waitUntil: "networkidle2" });

    try {
      await page.click(`a[href="/docs"]`);
      await waitForText(page, "h1", "Introduction");

      await page.click(`a[href="/docs/getting-started/create-a-project"]`);
      await waitForText(page, "h1", "Create a project");
    } catch (err) {
      console.log(logs);
      throw err;
    }
  });
});
