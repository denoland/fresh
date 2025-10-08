import * as path from "@std/path";
import { expect } from "@std/expect";
import { waitFor, waitForText, withBrowser } from "@fresh/internal/test-utils";
import {
  DEMO_DIR,
  FIXTURE_DIR,
  launchDevServer,
  prepareDevServer,
  spawnDevServer,
  updateFile,
  withDevServer,
} from "./test_utils.ts";

const tmp = await prepareDevServer(DEMO_DIR);
const demoServer = await spawnDevServer(tmp.dir, {
  FRESH_PUBLIC_FOO: "foobar",
});

Deno.test({
  name: "vite dev - launches",
  fn: async () => {
    const res = await fetch(`${demoServer.address()}/tests/it_works`);
    const text = await res.text();
    expect(text).toContain("it works");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - serves static files",
  fn: async () => {
    const res = await fetch(`${demoServer.address()}/test_static/foo.txt`);
    const text = await res.text();
    expect(text).toContain("it works");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - loads islands",
  fn: async () => {
    await withBrowser(async (page) => {
      await page.goto(`${demoServer.address()}/tests/island_hooks`, {
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
    await withBrowser(async (page) => {
      await page.goto(`${demoServer.address()}/tests/island_hooks`, {
        waitUntil: "networkidle2",
      });
      await waitForText(page, "button", "count: 0");
      await page.locator("button").click();
      await waitForText(page, "button", "count: 1");

      const island = path.join(
        demoServer.dir,
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

Deno.test({
  name: "vite dev - can import json in npm package",
  fn: async () => {
    await withBrowser(async (page) => {
      await page.goto(`${demoServer.address()}/tests/mime`, {
        waitUntil: "networkidle2",
      });
      await page.locator(".ready").wait();
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - inline env vars",
  fn: async () => {
    await withBrowser(async (page) => {
      await page.goto(`${demoServer.address()}/tests/env`, {
        waitUntil: "networkidle2",
      });
      await page.locator(".ready").wait();

      const res = await page.locator("pre").evaluate((el) =>
        // deno-lint-ignore no-explicit-any
        (el as any).textContent ?? ""
      );

      expect(JSON.parse(res)).toEqual({ deno: "foobar", nodeEnv: "foobar" });
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - serves imported assets",
  fn: async () => {
    // Vite has an internal allowlist that is refreshed when
    // pathnames are requested. It will discover valid static
    // files imported in JS once it encounters them. Therefore
    // we must request the URL that ultimately imports the
    // asset first for it to work.
    let res = await fetch(`${demoServer.address()}/tests/assets`);
    await res.body?.cancel();

    res = await fetch(`${demoServer.address()}/assets/deno-logo.png`);
    expect(res.status).toEqual(200);
    expect(res.headers.get("Content-Type")).toEqual("image/png");
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
    await withBrowser(async (page) => {
      await page.goto(`${demoServer.address()}/tests/partial`, {
        waitUntil: "networkidle2",
      });

      await page.locator(".ready").wait();
      await page.locator("a").click();
      await page.locator(".counter-hooks").wait();

      await page.locator(".counter-hooks button").click();
      await waitForText(page, ".counter-hooks button", "count: 1");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - json from jsr dependency",
  fn: async () => {
    const res = await fetch(`${demoServer.address()}/tests/dep_json`);
    const json = await res.json();
    expect(json.name).toEqual("@marvinh-test/import-json");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - import node:*",
  fn: async () => {
    const res = await fetch(`${demoServer.address()}/tests/feed`);
    await res.body?.cancel();
    expect(res.status).toEqual(200);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - css modules",
  fn: async () => {
    await withBrowser(async (page) => {
      await page.goto(`${demoServer.address()}/tests/css_modules`, {
        waitUntil: "networkidle2",
      });

      await waitFor(async () => {
        let color = await page
          .locator(".red > h1")
          // deno-lint-ignore no-explicit-any
          .evaluate((el) => window.getComputedStyle(el as any).color);
        expect(color).toEqual("rgb(255, 0, 0)");

        color = await page
          .locator(".green > h1")
          // deno-lint-ignore no-explicit-any
          .evaluate((el) => window.getComputedStyle(el as any).color);
        expect(color).toEqual("rgb(0, 128, 0)");

        color = await page
          .locator(".blue > h1")
          // deno-lint-ignore no-explicit-any
          .evaluate((el) => window.getComputedStyle(el as any).color);
        expect(color).toEqual("rgb(0, 0, 255)");

        // Route css
        color = await page
          .locator(".route > h1")
          // deno-lint-ignore no-explicit-any
          .evaluate((el) => window.getComputedStyle(el as any).color);
        expect(color).toEqual("rgb(255, 218, 185)");
        return true;
      });
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - route css import",
  fn: async () => {
    await withBrowser(async (page) => {
      await page.goto(`${demoServer.address()}/tests/css`, {
        waitUntil: "networkidle2",
      });

      await waitFor(async () => {
        const color = await page
          .locator("h1")
          // deno-lint-ignore no-explicit-any
          .evaluate((el) => window.getComputedStyle(el as any).color);
        expect(color).toEqual("rgb(255, 0, 0)");
        return true;
      });
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "vite dev - nested islands",
  fn: async () => {
    await withBrowser(async (page) => {
      await page.goto(`${demoServer.address()}/tests/island_nested`, {
        waitUntil: "networkidle2",
      });

      await page.locator(".outer-ready").wait();
      await page.locator(".inner-ready").wait();
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

// issue: https://github.com/denoland/fresh/issues/3322
Deno.test({
  name: "vite dev - allow routes looking like static paths",
  fn: async () => {
    const res = await fetch(
      `${demoServer.address()}/tests/api/@marvinh@infosec.exchange`,
    );
    const text = await res.text();
    expect(text).toEqual("ok");
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

// issue: https://github.com/denoland/fresh/issues/3323
Deno.test({
  name: "vite dev - npm:pg",
  fn: async () => {
    const res = await fetch(`${demoServer.address()}/tests/pg`);
    const text = await res.text();
    expect(text).toContain("<h1>pg</h1>");
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite dev - npm:ioredis",
  fn: async () => {
    const res = await fetch(`${demoServer.address()}/tests/ioredis`);
    const text = await res.text();
    expect(text).toContain("<h1>ioredis</h1>");
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite dev - redis",
  fn: async () => {
    const res = await fetch(`${demoServer.address()}/tests/redis`);
    const text = await res.text();
    expect(text).toContain("<h1>redis</h1>");
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite dev - @supabase/postgres-js",
  fn: async () => {
    const res = await fetch(`${demoServer.address()}/tests/supabase_pg`);
    const text = await res.text();
    expect(text).toContain("<h1>supabase</h1>");
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite dev - radix",
  fn: async () => {
    const res = await fetch(`${demoServer.address()}/tests/radix`);
    const text = await res.text();
    expect(text).toContain("click me</button>");
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite dev - static index.html",
  fn: async () => {
    const res = await fetch(`${demoServer.address()}/test_static/foo`);
    const text = await res.text();
    expect(text).toContain("<h1>ok</h1>");
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite dev - load .env files",
  fn: async () => {
    const res = await fetch(`${demoServer.address()}/tests/env_files`);
    const json = await res.json();
    expect(json).toEqual({
      MY_ENV: "MY_ENV test value",
      VITE_MY_ENV: "VITE_MY_ENV test value",
      MY_LOCAL_ENV: "MY_LOCAL_ENV test value",
      VITE_MY_LOCAL_ENV: "VITE_MY_LOCAL_ENV test value",
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite dev - support _middleware Array",
  fn: async () => {
    const res = await fetch(`${demoServer.address()}/tests/middlewares`);
    const text = await res.text();
    expect(text).toEqual("AB");
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite dev - support jsx namespace",
  fn: async () => {
    const res = await fetch(`${demoServer.address()}/tests/jsx_namespace`);
    const text = await res.text();
    expect(text).toContain(`xml:space="preserve"`);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
