import {
  withBrowser,
  withChildProcessServer,
} from "../packages/fresh/tests/test_utils.tsx";
import { expect } from "@std/expect";
import { retry } from "@std/async/retry";
import { buildVite } from "../packages/plugin-vite/tests/test_utils.ts";

async function runTests() {
  // Build the project
  await using result = await buildVite(import.meta.dirname!);

  Deno.test("CORS should not set on GET /fresh-badge.svg", async () => {
    await withChildProcessServer(
      {
        cwd: result.tmp,
        args: ["serve", "-A", "--port", "0", "_fresh/server.js"],
      },
      async (address) => {
        const resp = await fetch(`${address}/fresh-badge.svg`);
        await resp?.body?.cancel();
        expect(resp.headers.get("cross-origin-resource-policy")).toEqual(null);
      },
    );
  });

  Deno.test({
    name: "shows version selector",
    fn: async () => {
      await retry(async () => {
        await withChildProcessServer(
          {
            cwd: result.tmp,
            args: ["serve", "-A", "--port", "0", "_fresh/server.js"],
          },
          async (address) => {
            await withBrowser(async (page) => {
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

              expect(options.map((item) => item.value)).toEqual([
                "latest",
                "1.x",
              ]);

              const selectValue = await page
                .locator<HTMLSelectElement>("#version")
                .evaluate((el) => el.value);
              expect(selectValue).toEqual("latest");

              // Go to canary page
              await page.evaluate(() => {
                const el = document.querySelector(
                  "#version",
                ) as HTMLSelectElement;
                el.value = "1.x";
                el.dispatchEvent(new Event("change"));
              });

              await new Promise((r) => setTimeout(r, 1000));

              await page.waitForSelector("#version:not([disabled])");
              const selectValue2 = await page
                .locator<HTMLSelectElement>("#version")
                .evaluate((el) => el.value);
              expect(selectValue2).toEqual("1.x");

              await page.waitForFunction(() => {
                const url = new URL(window.location.href);
                return url.pathname === "/docs/1.x/introduction";
              });
            });
          },
        );
      });
    },
  });
}

runTests();
