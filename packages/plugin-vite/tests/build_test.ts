import { expect } from "@std/expect";
import {
  waitFor,
  waitForText,
  withBrowser,
} from "../../fresh/tests/test_utils.tsx";
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
  name: "vite build - creates compiled entry",
  fn: async () => {
    const stat = await Deno.stat(
      path.join(viteResult.tmp, "_fresh", "compiled-entry.js"),
    );

    expect(stat.isFile).toEqual(true);
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
  name: "vite build - nested islands",
  fn: async () => {
    await launchProd(
      { cwd: viteResult.tmp },
      async (address) => {
        await withBrowser(async (page) => {
          await page.goto(`${address}/tests/island_nested`, {
            waitUntil: "networkidle2",
          });

          await page.locator(".outer-ready").wait();
          await page.locator(".inner-ready").wait();
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
  name: "vite build - css modules",
  fn: async () => {
    await launchProd(
      { cwd: viteResult.tmp },
      async (address) => {
        await withBrowser(async (page) => {
          await page.goto(`${address}/tests/css_modules`, {
            waitUntil: "networkidle2",
          });

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
        });
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - route css import",
  fn: async () => {
    await launchProd(
      { cwd: viteResult.tmp },
      async (address) => {
        await withBrowser(async (page) => {
          await page.goto(`${address}/tests/css`, {
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

Deno.test({
  name: "vite build - error on 'node:process' import",
  fn: async () => {
    const fixture = path.join(FIXTURE_DIR, "node_builtin");

    await expect(buildVite(fixture)).rejects.toThrow(
      "Node built-in modules cannot be imported in the browser",
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - static index.html",
  fn: async () => {
    await launchProd(
      { cwd: viteResult.tmp },
      async (address) => {
        const res = await fetch(`${address}/test_static/foo`);
        const text = await res.text();
        expect(text).toContain("<h1>ok</h1>");
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - base path asset handling",
  fn: async () => {
    await using res = await buildVite(DEMO_DIR, { base: "/my-app/" });

    // Read the generated server.js to check asset paths
    const serverJs = await Deno.readTextFile(
      path.join(res.tmp, "_fresh", "server.js"),
    );

    // Asset paths should include the base path /my-app/
    expect(serverJs).toContain('"/my-app/assets/');
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - env files",
  fn: async () => {
    await launchProd(
      { cwd: viteResult.tmp },
      async (address) => {
        const res = await fetch(`${address}/tests/env_files`);
        const json = await res.json();
        expect(json).toEqual({
          MY_ENV: "MY_ENV test value",
          VITE_MY_ENV: "VITE_MY_ENV test value",
          MY_LOCAL_ENV: "MY_LOCAL_ENV test value",
          VITE_MY_LOCAL_ENV: "VITE_MY_LOCAL_ENV test value",
        });
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - support _middleware Array",
  fn: async () => {
    await launchProd(
      { cwd: viteResult.tmp },
      async (address) => {
        const res = await fetch(`${address}/tests/middlewares`);
        const text = await res.text();
        expect(text).toEqual("AB");
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "vite build - island named after global object (Map)",
  fn: async () => {
    const fixture = path.join(FIXTURE_DIR, "island_global_name");
    await using res = await buildVite(fixture);

    await launchProd(
      { cwd: res.tmp },
      async (address) => {
        const response = await fetch(address);
        const html = await response.text();

        // Verify the fix: UniqueNamer prefixes "Map" with underscore to prevent shadowing
        // Without the fix: import Map from "..." and boot({Map}, ...) - shadows global Map
        // With the fix: import _Map_N from "..." and boot({_Map_N}, ...) - no shadowing
        expect(html).toMatch(/import.*_Map(_\d+)?.*from/);
        expect(html).toMatch(/boot\(\s*\{\s*_Map(_\d+)?\s*\}/);
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
