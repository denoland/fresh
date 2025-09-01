import { expect } from "@std/expect";
import { waitForText, withBrowser } from "../../fresh/tests/test_utils.tsx";
import {
  buildVite,
  DEMO_DIR,
  FIXTURE_DIR,
  launchProd,
  usingEnv,
} from "./test_utils.ts";
import * as path from "@std/path";

const viteResult = await buildVite(DEMO_DIR);

Deno.test({
  name: "vite build - launches",
  fn: async () => {
    await launchProd(
      { cwd: viteResult.tmp },
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
    await launchProd(
      { cwd: viteResult.tmp },
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
    await launchProd(
      { cwd: viteResult.tmp },
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

    await launchProd(
      { cwd: res.tmp },
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

    await launchProd(
      { cwd: res.tmp },
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

    await launchProd(
      { cwd: res.tmp },
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
    await launchProd(
      { cwd: viteResult.tmp },
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
    await launchProd(
      { cwd: viteResult.tmp },
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

    await launchProd(
      { cwd: res.tmp },
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

          expect(href).toMatch(/\/assets\/client-entry-.*\.css(\?.*)?$/);
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

    await launchProd(
      { cwd: res.tmp },
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
    await launchProd(
      { cwd: viteResult.tmp },
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

Deno.test({
  name: "vite build - build ID uses env variables when set",
  fn: async () => {
    const revision = "test-commit-hash-123";

    // We're running on GitHub Actions, so GITHUB_SHA will always
    // be set
    Deno.env.delete("GITHUB_SHA");

    for (
      const key of [
        "DENO_DEPLOYMENT_ID",
        "GITHUB_SHA",
        "CI_COMMIT_SHA",
        "OTHER",
      ]
    ) {
      using _ = usingEnv(key, revision);
      await using res = await buildVite(DEMO_DIR);

      await launchProd(
        { cwd: res.tmp },
        async (address) => {
          const res = await fetch(`${address}/tests/build_id`);
          const text = await res.text();

          if (key === "OTHER") {
            expect(text).not.toEqual(revision);
          } else {
            expect(text).toEqual(revision);
          }
        },
      );
    }
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - import json from jsr dependency",
  fn: async () => {
    await launchProd(
      { cwd: viteResult.tmp },
      async (address) => {
        const res = await fetch(`${address}/tests/dep_json`);
        const json = await res.json();
        expect(json.name).toEqual("@marvinh-test/import-json");
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - import node:*",
  fn: async () => {
    await launchProd(
      { cwd: viteResult.tmp },
      async (address) => {
        const res = await fetch(`${address}/tests/feed`);
        await res.body?.cancel();
        expect(res.status).toEqual(200);
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - island css modules",
  fn: async () => {
    await launchProd(
      { cwd: viteResult.tmp },
      async (address) => {
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
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - remote island",
  fn: async () => {
    const fixture = path.join(FIXTURE_DIR, "remote_island");
    await using res = await buildVite(fixture);

    await launchProd(
      { cwd: res.tmp },
      async (address) => {
        await withBrowser(async (page) => {
          await page.goto(`${address}`, {
            waitUntil: "networkidle2",
          });

          await page.locator(".remote-island").wait();
          await page.locator(".increment").click();
          await waitForText(page, ".result", "Count: 1");
        });
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
