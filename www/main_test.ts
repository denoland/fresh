import VERSIONS from "../versions.json" with { type: "json" };
import { app } from "./main.ts";
import { buildProd, withBrowserApp } from "../tests/test_utils.tsx";
import { expect } from "@std/expect";
import { retry } from "@std/async/retry";

await buildProd(app);
const handler = await app.handler();

Deno.test("CORS should not set on GET /fresh-badge.svg", async () => {
  const req = new Request("http://localhost/fresh-badge.svg");
  const resp = await handler(req);
  await resp?.body?.cancel();

  expect(resp.headers.get("cross-origin-resource-policy")).toEqual(null);
});

Deno.test("/docs route properly", async (t: Deno.TestContext) => {
  const validPaths = [
    "/introduction",
    "/getting-started",
    "/getting-started/create-a-project",
    "/concepts",
    "/concepts/routing",
    "/examples/writing-tests",
  ];

  await t.step("redirects work", async () => {
    const redirects: [string, string][] = [
      // root redirect configured in  docs/index.tsx
      ["/docs", "/docs/introduction"],
      // redirects configured in in docs/_middleware.ts
      [
        "/docs/getting-started/fetching-data",
        "http://localhost/docs/getting-started/custom-handlers",
      ],
      // version roots redirect to getFirstPageUrl(version)
      ["/docs/latest", "/docs/introduction"],
      ["/docs/canary", "/docs/canary/the-canary-version"],
    ];

    for (const [from, to] of redirects) {
      const req = new Request(`http://localhost${from}`);
      const resp = await handler(req);
      expect(resp.status).toEqual(307);
      expect(resp.headers.get("location")).toEqual(to);
    }
  });

  await t.step("valid /docs/:slug requests should return 200", async () => {
    for (const path of validPaths) {
      const req = new Request(`http://localhost/docs${path}`);
      const resp = await handler(req);
      expect(resp.status).toEqual(200);
    }
  });

  await t.step("valid /docs/:version/:slug should return 200", async () => {
    for (const version of ["latest", "canary"]) {
      for (const path of validPaths) {
        const req = new Request(`http://localhost/docs/${version}${path}`);
        const resp = await handler(req);
        expect(resp.status).toEqual(200);
      }
    }
  });

  await t.step("invalid paths should 404", async () => {
    const invalidPaths = [
      "/foo",
      "/foo/bar",
      "/concepts/foo/bar",
      "/latest/foo",
      "/latest/foo/bar",
      "/latest/concepts/foo/bar",
      "/canary/foo",
      "/canary/foo/bar",
      "/canary/concepts/foo/bar",
      "/foo/concepts",
      "/foo/concepts/routing",
    ];
    for (const path of invalidPaths) {
      const req = new Request(`http://localhost/docs/${path}`);
      const resp = await handler(req);
      expect(resp.status).toEqual(404);
    }
  });
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
