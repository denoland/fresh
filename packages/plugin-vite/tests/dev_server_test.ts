import * as path from "@std/path";
import { expect } from "@std/expect";
import { waitForText, withBrowser } from "../../fresh/tests/test_utils.tsx";
import {
  DEMO_DIR,
  FIXTURE_DIR,
  updateFile,
  withDevServer,
} from "./test_utils.ts";

Deno.test({
  name: "vite dev - launches",
  fn: async () => {
    await withDevServer(DEMO_DIR, async (address) => {
      const res = await fetch(`${address}/tests/it_works`);
      const text = await res.text();
      expect(text).toContain("it works");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - serves static files",
  fn: async () => {
    await withDevServer(DEMO_DIR, async (address) => {
      const res = await fetch(`${address}/test_static/foo.txt`);
      const text = await res.text();
      expect(text).toContain("it works");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - loads islands",
  fn: async () => {
    await withDevServer(DEMO_DIR, async (address) => {
      await withBrowser(async (page) => {
        await page.goto(`${address}/tests/island_hooks`, {
          waitUntil: "networkidle2",
        });
        await waitForText(page, "button", "count: 0");

        await page.locator("button").click();
        await waitForText(page, "button", "count: 1");
      });
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - starts without static/ dir",
  fn: async () => {
    const fixture = path.join(FIXTURE_DIR, "no_static");
    await withDevServer(fixture, async (address) => {
      const res = await fetch(`${address}/`);
      const text = await res.text();
      expect(text).toContain("ok");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - starts without islands/ dir",
  fn: async () => {
    const fixture = path.join(FIXTURE_DIR, "no_islands");
    await withDevServer(fixture, async (address) => {
      const res = await fetch(`${address}/`);
      const text = await res.text();
      expect(text).toContain("ok");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - starts without routes/ dir",
  fn: async () => {
    const fixture = path.join(FIXTURE_DIR, "no_routes");
    await withDevServer(fixture, async (address) => {
      const res = await fetch(`${address}/`);
      const text = await res.text();
      expect(text).toContain("ok");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - can apply HMR to islands (hooks)",
  ignore: true, // Test is very flaky
  fn: async () => {
    await withDevServer(DEMO_DIR, async (address, dir) => {
      await withBrowser(async (page) => {
        await page.goto(`${address}/tests/island_hooks`, {
          waitUntil: "networkidle2",
        });
        await waitForText(page, "button", "count: 0");
        await page.locator("button").click();
        await waitForText(page, "button", "count: 1");

        const island = path.join(
          dir,
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
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - can import json in npm package",
  fn: async () => {
    await withDevServer(DEMO_DIR, async (address) => {
      await withBrowser(async (page) => {
        await page.goto(`${address}/tests/mime`, {
          waitUntil: "networkidle2",
        });
        await page.locator(".ready").wait();
      });
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - inline env vars",
  fn: async () => {
    await withDevServer(DEMO_DIR, async (address) => {
      await withBrowser(async (page) => {
        await page.goto(`${address}/tests/env`, {
          waitUntil: "networkidle2",
        });
        await page.locator(".ready").wait();

        const res = await page.locator("pre").evaluate((el) =>
          // deno-lint-ignore no-explicit-any
          (el as any).textContent ?? ""
        );

        expect(JSON.parse(res)).toEqual({ deno: "foobar", nodeEnv: "foobar" });
      });
    }, { FRESH_PUBLIC_FOO: "foobar" });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - serves imported assets",
  fn: async () => {
    await withDevServer(DEMO_DIR, async (address) => {
      const res = await fetch(`${address}/assets/deno-logo.png`);
      expect(res.status).toEqual(200);
      expect(res.headers.get("Content-Type")).toEqual("image/png");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
