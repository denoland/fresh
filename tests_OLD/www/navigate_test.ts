import { runBuild, waitForText, withPageName } from "../test_utils.ts";

Deno.test("www - docs navigation", async () => {
  await runBuild("./www/dev.ts");
  await withPageName("./www/main.ts", async (page, address) => {
    await page.goto(`${address}`);

    await page.click(`a[href="/docs"]`);
    await waitForText(page, "h1", "Introduction");

    await page.click(`a[href="/docs/getting-started/create-a-project"]`);
    await waitForText(page, "h1", "Create a project");
  });
});
