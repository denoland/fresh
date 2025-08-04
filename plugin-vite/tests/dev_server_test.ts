import * as path from "@std/path";
import { expect } from "@std/expect";
import { waitForText, withBrowser } from "../../tests/test_utils.tsx";
import { DEMO_DIR, launchDevServer, updateFile } from "./test_utils.ts";

Deno.test({
  name: "vite dev - launches",
  fn: async () => {
    await using server = await launchDevServer();

    const res = await fetch(`${server.addr}/tests/it_works`);
    const text = await res.text();
    expect(text).toContain("it works");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - serves static files",
  fn: async () => {
    await using server = await launchDevServer();

    const res = await fetch(`${server.addr}/test_static/foo.txt`);
    const text = await res.text();
    expect(text).toContain("it works");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - loads islands",
  fn: async () => {
    await using server = await launchDevServer();

    await withBrowser(async (page) => {
      await page.goto(`${server.addr}/tests/island_hooks`, {
        waitUntil: "networkidle2",
      });
      await waitForText(page, "button", "count: 0");

      await page.locator("button").click();
      await waitForText(page, "button", "count: 1");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - can apply HMR to islands (hooks)",
  ignore: true, // Test is very flaky
  fn: async () => {
    await using server = await launchDevServer();

    await withBrowser(async (page) => {
      await page.goto(`${server.addr}/tests/island_hooks`, {
        waitUntil: "networkidle2",
      });
      await waitForText(page, "button", "count: 0");
      await page.locator("button").click();
      await waitForText(page, "button", "count: 1");

      const island = path.join(
        DEMO_DIR,
        "islands",
        "tests",
        "CounterHooks.tsx",
      );
      await using _ = await updateFile(
        island,
        (text) => text.replace("count:", "hmr:"),
      );

      await waitForText(page, "button", "hmr: 1");
      await page.locator("button").click();
      await waitForText(page, "button", "hmr: 2");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
