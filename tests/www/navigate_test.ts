import { waitForText, withPageName } from "$fresh/tests/test_utils.ts";

Deno.test("www - docs navigation", async () => {
  await withPageName("./www/main.ts", async (page, address) => {
    await page.goto(`${address}`, { waitUntil: "networkidle2" });
    await page.click(`a[href="/docs"]`);
    await waitForText(page, "h1", "Introduction");

    await page.click(`a[href="/docs/getting-started/create-a-project"]`);
    await waitForText(page, "h1", "Create a project");
  });
});
