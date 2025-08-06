import { expect } from "@std/expect";
import {
  waitForText,
  withBrowser,
  withChildProcessServer,
} from "../../tests/test_utils.tsx";
import { buildVite } from "./test_utils.ts";

Deno.test({
  name: "vite build - launches",
  fn: async () => {
    await using res = await buildVite();

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
    await using viteResult = await buildVite();

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
    await using res = await buildVite();

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
