import { assertArrayIncludes, assertEquals } from "$std/assert/mod.ts";
import { withPageName } from "../tests/test_utils.ts";
import { dirname, join } from "$std/path/mod.ts";
import VERSIONS from "../versions.json" with { type: "json" };
import { createHandler } from "../server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";

const dir = dirname(import.meta.url);
const handler = await createHandler(manifest, config);

Deno.test("CORS should not set on GET /fresh-badge.svg", async () => {
  const req = new Request("http://localhost/fresh-badge.svg");
  const resp = await handler(req);
  await resp?.body?.cancel();

  assertEquals(resp.headers.get("cross-origin-resource-policy"), null);
});

Deno.test("shows version selector", async () => {
  await withPageName(join(dir, "./main.ts"), async (page, address) => {
    await page.goto(`${address}/docs`);
    await page.waitForSelector("#version");

    // Check that we redirected to the first page
    assertEquals(page.url(), `${address}/docs/introduction`);

    // Wait for version selector to be enabled
    await page.waitForSelector("#version:not([disabled])");

    const options = await page.$eval("#version", (el: HTMLSelectElement) => {
      return Array.from(el.options).map((option) => ({
        value: option.value,
        label: option.textContent,
      }));
    });

    assertEquals(options.length, 2);
    assertArrayIncludes(options, [
      {
        value: "canary",
        label: "canary",
      },
      {
        value: "latest",
        label: VERSIONS[0],
      },
    ]);

    const selectValue = await page.$eval(
      "#version",
      (el: HTMLSelectElement) => el.value,
    );
    assertEquals(selectValue, "latest");

    // Go to canary page
    await Promise.all([
      page.waitForNavigation(),
      page.select("#version", "canary"),
    ]);

    await page.waitForSelector("#version:not([disabled])");
    const selectValue2 = await page.$eval(
      "#version",
      (el: HTMLSelectElement) => el.value,
    );
    assertEquals(selectValue2, "canary");

    assertEquals(page.url(), `${address}/docs/canary/introduction`);
  });
});
