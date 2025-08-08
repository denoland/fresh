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
