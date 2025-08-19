import { expect } from "@std/expect";
import {
  waitForText,
  withBrowser,
  withChildProcessServer,
} from "../../fresh/tests/test_utils.tsx";
import { buildVite, DEMO_DIR, FIXTURE_DIR } from "./test_utils.ts";
import * as path from "@std/path";

Deno.test({
  name: "vite build - launches",
  fn: async () => {
    await using res = await buildVite(DEMO_DIR);

    await withChildProcessServer(
      {
        cwd: res.tmp,
        args: ["serve", "-A", "--port", "0", "_fresh/server.js"],
      },
      async (address) => {
        const res = await fetch(address);
        const text = await res.text();
        expect(text).toEqual("it works");
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - serves static files",
  fn: async () => {
    await using viteResult = await buildVite(DEMO_DIR);

    await withChildProcessServer(
      {
        cwd: viteResult.tmp,
        args: ["serve", "-A", "--port", "0", "_fresh/server.js"],
      },
      async (address) => {
        const res = await fetch(`${address}/test_static/foo.txt`);
        const text = await res.text();
        expect(text).toEqual("it works");
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - loads islands",
  fn: async () => {
    await using res = await buildVite(DEMO_DIR);

    await withChildProcessServer(
      {
        cwd: res.tmp,
        args: ["serve", "-A", "--port", "0", "_fresh/server.js"],
      },
      async (address) => {
        await withBrowser(async (page) => {
          await page.goto(`${address}/tests/island_hooks`, {
            waitUntil: "networkidle2",
          });

          await waitForText(page, "button", "count: 0");

          await page.locator("button").click();
          await waitForText(page, "button", "count: 1");
        });
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - without static/ dir",
  fn: async () => {
    const fixture = path.join(FIXTURE_DIR, "no_static");
    await using res = await buildVite(fixture);

    await withChildProcessServer(
      {
        cwd: res.tmp,
        args: ["serve", "-A", "--port", "0", "_fresh/server.js"],
      },
      async (address) => {
        const res = await fetch(`${address}/ok`);
        const text = await res.text();
        expect(text).toEqual("ok");
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - without islands/ dir",
  fn: async () => {
    const fixture = path.join(FIXTURE_DIR, "no_islands");
    await using res = await buildVite(fixture);

    await withChildProcessServer(
      {
        cwd: res.tmp,
        args: ["serve", "-A", "--port", "0", "_fresh/server.js"],
      },
      async (address) => {
        const res = await fetch(`${address}`);
        const text = await res.text();
        expect(text).toContain("ok");
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - without routes/ dir",
  fn: async () => {
    const fixture = path.join(FIXTURE_DIR, "no_routes");
    await using res = await buildVite(fixture);

    await withChildProcessServer(
      {
        cwd: res.tmp,
        args: ["serve", "-A", "--port", "0", "_fresh/server.js"],
      },
      async (address) => {
        const res = await fetch(`${address}`);
        const text = await res.text();
        expect(text).toEqual("ok");
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - load json inside npm package",
  fn: async () => {
    await using res = await buildVite(DEMO_DIR);

    await withChildProcessServer(
      {
        cwd: res.tmp,
        args: ["serve", "-A", "--port", "0", "_fresh/server.js"],
      },
      async (address) => {
        await withBrowser(async (page) => {
          await page.goto(`${address}/tests/mime`, {
            waitUntil: "networkidle2",
          });

          await page.locator(".ready").wait();
        });
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - fetch static assets",
  fn: async () => {
    await using res = await buildVite(DEMO_DIR);

    await withChildProcessServer(
      {
        cwd: res.tmp,
        args: ["serve", "-A", "--port", "0", "_fresh/server.js"],
      },
      async (address) => {
        await withBrowser(async (page) => {
          await page.goto(`${address}/tests/assets`, {
            waitUntil: "networkidle2",
          });

          const url = await page.locator("img").evaluate((el) =>
            // deno-lint-ignore no-explicit-any
            (el as any).src
          );

          const res = await fetch(url);
          await res.body?.cancel();
          expect(res.status).toEqual(200);
          expect(res.headers.get("Content-Type")).toEqual("image/png");
        });
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - tailwind no _app",
  fn: async () => {
    const fixture = path.join(FIXTURE_DIR, "tailwind_no_app");
    await using res = await buildVite(fixture);

    await withChildProcessServer(
      {
        cwd: res.tmp,
        args: ["serve", "-A", "--port", "0", "_fresh/server.js"],
      },
      async (address) => {
        await withBrowser(async (page) => {
          await page.goto(`${address}`, {
            waitUntil: "networkidle2",
          });

          const href = await page
            .locator("link[rel='stylesheet']")
            .evaluate((el) => {
              // deno-lint-ignore no-explicit-any
              return (el as any).href;
            });

          expect(href).toMatch(/\/assets\/client-entry-.*\.css$/);
        });
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - tailwind _app",
  fn: async () => {
    const fixture = path.join(FIXTURE_DIR, "tailwind_app");
    await using res = await buildVite(fixture);

    await withChildProcessServer(
      {
        cwd: res.tmp,
        args: ["serve", "-A", "--port", "0", "_fresh/server.js"],
      },
      async (address) => {
        await withBrowser(async (page) => {
          await page.goto(`${address}`, {
            waitUntil: "networkidle2",
          });

          const href = await page
            .locator("link[rel='stylesheet']")
            .evaluate((el) => {
              // deno-lint-ignore no-explicit-any
              return (el as any).href;
            });

          expect(href).toMatch(/\/assets\/client-entry-.*\.css/);
        });
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - partial island",
  fn: async () => {
    await using res = await buildVite(DEMO_DIR);

    await withChildProcessServer(
      {
        cwd: res.tmp,
        args: ["serve", "-A", "--port", "0", "_fresh/server.js"],
      },
      async (address) => {
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
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
