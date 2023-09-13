import { waitForStyle, withPageName } from "$fresh/tests/test_utils.ts";

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
