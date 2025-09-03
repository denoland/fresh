import * as path from "@std/path";
import { expect } from "@std/expect";
import { waitForText, withBrowser } from "../../fresh/tests/test_utils.tsx";
import {
  DEMO_DIR,
  FIXTURE_DIR,
  launchDevServer,
  prepareDevServer,
  updateFile,
  withDevServer,
} from "./test_utils.ts";

const tmp = await prepareDevServer(DEMO_DIR);

Deno.test({
  name: "vite dev - launches",
  fn: async () => {
    await launchDevServer(tmp.dir, async (address) => {
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
    await launchDevServer(tmp.dir, async (address) => {
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
    await launchDevServer(tmp.dir, async (address) => {
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
    await launchDevServer(tmp.dir, async (address, dir) => {
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
    await launchDevServer(tmp.dir, async (address) => {
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
    await launchDevServer(tmp.dir, async (address) => {
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
    await launchDevServer(tmp.dir, async (address) => {
      const res = await fetch(`${address}/assets/deno-logo.png`);
      expect(res.status).toEqual(200);
      expect(res.headers.get("Content-Type")).toEqual("image/png");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - tailwind no _app",
  fn: async () => {
    const fixture = path.join(FIXTURE_DIR, "tailwind_no_app");
    await withDevServer(fixture, async (address) => {
      await withBrowser(async (page) => {
        await page.goto(`${address}`, {
          waitUntil: "networkidle2",
        });

        await page.locator("style[data-vite-dev-id$='style.css']").wait();
      });
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - tailwind _app",
  fn: async () => {
    const fixture = path.join(FIXTURE_DIR, "tailwind_app");
    await withDevServer(fixture, async (address) => {
      await withBrowser(async (page) => {
        await page.goto(`${address}`, {
          waitUntil: "networkidle2",
        });

        await page.locator("style[data-vite-dev-id$='style.css']").wait();
      });
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - partial island",
  fn: async () => {
    await launchDevServer(tmp.dir, async (address) => {
      await withBrowser(async (page) => {
        await page.goto(`${address}/tests/partial`, {
          waitUntil: "networkidle2",
        });

        await page.locator(".ready").wait();
        await page.locator("a").click();
        await page.locator(".counter-hooks").wait();

        await page.locator(".counter-hooks button").click();
        await waitForText(page, ".counter-hooks button", "count: 1");
      });
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - json from jsr dependency",
  fn: async () => {
    await launchDevServer(tmp.dir, async (address) => {
      const res = await fetch(`${address}/tests/dep_json`);
      const json = await res.json();
      expect(json.name).toEqual("@marvinh-test/import-json");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - import node:*",
  fn: async () => {
    await launchDevServer(tmp.dir, async (address) => {
      const res = await fetch(`${address}/tests/feed`);
      await res.body?.cancel();
      expect(res.status).toEqual(200);
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - island css modules",
  fn: async () => {
    await launchDevServer(tmp.dir, async (address) => {
      await withBrowser(async (page) => {
        await page.goto(`${address}/tests/css_modules`, {
          waitUntil: "networkidle2",
        });

        const color = await page
          .locator("h1")
          // deno-lint-ignore no-explicit-any
          .evaluate((el) => window.getComputedStyle(el as any).color);
        expect(color).toEqual("rgb(255, 0, 0)");
      });
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - remote island",
  fn: async () => {
    const fixture = path.join(FIXTURE_DIR, "remote_island");
    await launchDevServer(fixture, async (address) => {
      await withBrowser(async (page) => {
        await page.goto(`${address}`, {
          waitUntil: "networkidle2",
        });

        await page.locator(".remote-island").wait();
        await page.locator(".increment").click();
        await waitForText(page, ".result", "Count: 1");
      });
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - error on 'node:process' import",
  fn: async () => {
    const fixture = path.join(FIXTURE_DIR, "node_builtin");

    await launchDevServer(fixture, async (address) => {
      let res = await fetch(`${address}`);
      await res.body?.cancel();

      res = await fetch(`${address}/@id/fresh-island::NodeIsland`);
      await res.body?.cancel();

      expect(res.status).toEqual(500);
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite dev - import commonjs conditionally",
  fn: async () => {
    await launchDevServer(DEMO_DIR, async (address) => {
      const res = await fetch(`${address}/tests/commonjs_conditional`);
      const text = await res.text();
      expect(text).toContain("<h1>server</h1>");
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite dev - loads npm:pg",
  fn: async () => {
    await launchDevServer(DEMO_DIR, async (address) => {
      const res = await fetch(`${address}/tests/pg`);
      await res.body?.cancel();
      expect(res.status).toEqual(200);
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite dev - loads npm:ioredis",
  fn: async () => {
    await launchDevServer(DEMO_DIR, async (address) => {
      const res = await fetch(`${address}/tests/ioredis`);
      await res.body?.cancel();
      expect(res.status).toEqual(200);
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
