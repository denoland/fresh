import VERSIONS from "../versions.json" with { type: "json" };
import { app } from "./main.ts";
import { buildProd, withBrowserApp } from "../tests/test_utils.tsx";
import { expect } from "@std/expect";
import { retry } from "@std/async/retry";

const handler = await app.handler();

Deno.test("CORS should not set on GET /fresh-badge.svg", async () => {
  const req = new Request("http://localhost/fresh-badge.svg");
  await buildProd(app);
  const resp = await handler(req);
  await resp?.body?.cancel();

  expect(resp.headers.get("cross-origin-resource-policy")).toEqual(null);
});

Deno.test({
  name: "shows version selector",
  fn: async () => {
    await retry(async () => {
      await withBrowserApp(app, async (page, address) => {
        await page.goto(`${address}/docs`);
        await page.waitForSelector("#version");

        // Check that we redirected to the first page
        await page.waitForFunction(() => {
          const url = new URL(window.location.href);
          return url.pathname === "/docs/introduction";
        });

        // Wait for version selector to be enabled
        await page.waitForSelector("#version:not([disabled])");

        const options = await page
          .locator<HTMLSelectElement>("#version")
          .evaluate((el) => {
            return Array.from(el.options).map((option) => ({
              value: option.value,
              label: option.textContent,
            }));
          });

        expect(options).toEqual([
          {
            value: "canary",
            label: "canary",
          },
          {
            value: "latest",
            label: VERSIONS[0],
          },
        ]);

        const selectValue = await page
          .locator<HTMLSelectElement>("#version")
          .evaluate((el) => el.value);
        expect(selectValue).toEqual("latest");

        // Go to canary page
        await page.evaluate(() => {
          const el = document.querySelector("#version") as HTMLSelectElement;
          el.value = "canary";
          el.dispatchEvent(new Event("change"));
        });

        await new Promise((r) => setTimeout(r, 1000));

        await page.waitForSelector("#version:not([disabled])");
        const selectValue2 = await page
          .locator<HTMLSelectElement>("#version")
          .evaluate((el) => el.value);
        expect(selectValue2).toEqual("canary");

        await page.waitForFunction(() => {
          const url = new URL(window.location.href);
          return url.pathname === "/docs/canary/introduction";
        });
      });
    });
  },
});
