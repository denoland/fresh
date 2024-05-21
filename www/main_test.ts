import VERSIONS from "../versions.json" with { type: "json" };
import { app } from "./main.ts";
import { buildProd, withBrowserApp } from "../tests/test_utils.tsx";
import { expect } from "@std/expect";

const handler = await app.handler();

Deno.test("CORS should not set on GET /fresh-badge.svg", async () => {
  const req = new Request("http://localhost/fresh-badge.svg");
  await buildProd(app);
  const resp = await handler(req);
  await resp?.body?.cancel();

  expect(resp.headers.get("cross-origin-resource-policy")).toEqual(null);
});

Deno.test("shows version selector", async () => {
  await withBrowserApp(app, async (page, address) => {
    await page.goto(`${address}/docs`);
    await page.waitForSelector("#version");

    // Check that we redirected to the first page
    expect(page.url()).toEqual(`${address}/docs/introduction`);

    // Wait for version selector to be enabled
    await page.waitForSelector("#version:not([disabled])");

    const options = await page.$eval("#version", (el: HTMLSelectElement) => {
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

    const selectValue = await page.$eval(
      "#version",
      (el: HTMLSelectElement) => el.value,
    );
    expect(selectValue).toEqual("latest");

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
    expect(selectValue2).toEqual("canary");

    expect(page.url()).toEqual(`${address}/docs/canary/introduction`);
  });
});
