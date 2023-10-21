import { copy } from "https://deno.land/std@0.204.0/fs/copy.ts";
import {
  basename,
  delay,
  dirname,
  join,
  Page,
  puppeteer,
  relative,
} from "./deps.ts";
import { startFreshServer, waitFor } from "./test_utils.ts";
import { retry } from "$std/async/retry.ts";
import { assert } from "$std/_util/asserts.ts";

async function withTmpFixture(
  name: string,
  fn: (page: Page, address: string, dir: string) => Promise<void>,
) {
  const tmp = join(await Deno.makeTempDir(), "project");
  const src = join(Deno.cwd(), dirname(name));
  await copy(src, tmp);

  // Update Fresh path
  const denoJsonPath = join(tmp, "deno.json");
  const json = JSON.parse(await Deno.readTextFile(denoJsonPath));
  json.imports["$fresh/"] = relative(denoJsonPath, Deno.cwd()) + "/";
  await Deno.writeTextFile(denoJsonPath, JSON.stringify(json, null, 2));

  // Watcher tests tend to be flaky
  await retry(async () => {
    const { lines, serverProcess, address } = await startFreshServer({
      args: ["run", "-A", "--watch", join(tmp, basename(name))],
      env: {
        "FRESH_ESBUILD_LOADER": "portable",
      },
    });

    try {
      await delay(100);
      const browser = await puppeteer.launch({ args: ["--no-sandbox"] });

      try {
        const page = await browser.newPage();
        await fn(page, address, tmp);
      } finally {
        await browser.close();
      }
    } finally {
      serverProcess.kill("SIGTERM");

      // Wait until the process exits
      await serverProcess.status;

      // Drain the lines stream
      for await (const _ of lines) { /* noop */ }
    }
  }, { maxAttempts: 3 });
}

Deno.test({
  name: "page reloads with no island present",
  // Watcher tests are pretty flaky in CI and non-UNIX systems.
  // Until we know why, we'll gate these tests behind an
  // environment variable.
  ignore: !Deno.env.has("FRESH_WATCH_TESTS"),
  fn: async () => {
    await withTmpFixture(
      "./tests/fixture_hmr/dev.ts",
      async (page, address, dir) => {
        await page.goto(`${address}/no_island`);
        await page.waitForSelector("h1");

        // Trigger file change
        const file = join(dir, "routes", "no_island.tsx");
        const text = await Deno.readTextFile(file);
        await Deno.writeTextFile(file, text.replaceAll("foo", "bar"));

        await page.waitForSelector(".bar");
      },
    );
  },
});

Deno.test({
  name: "page reloads with island",
  // Watcher tests are pretty flaky in CI and non-UNIX systems.
  // Until we know why, we'll gate these tests behind an
  // environment variable.
  ignore: !Deno.env.has("FRESH_WATCH_TESTS"),
  fn: async () => {
    await withTmpFixture(
      "./tests/fixture_hmr/dev.ts",
      async (page, address, dir) => {
        await page.goto(`${address}/island`);
        await page.waitForSelector("h1");

        // Trigger file change
        const file = join(dir, "routes", "island.tsx");
        const text = await Deno.readTextFile(file);
        await Deno.writeTextFile(file, text.replaceAll("foo", "bar"));

        await page.waitForSelector(".bar");
        // TODO: Once we support proper HMR check that state stays
        // the same
      },
    );
  },
});

Deno.test({
  name: "doesn't refresh on form submit",
  // Watcher tests are pretty flaky in CI and non-UNIX systems.
  // Until we know why, we'll gate these tests behind an
  // environment variable.
  // ignore: !Deno.env.has("FRESH_WATCH_TESTS"),
  fn: async () => {
    await withTmpFixture(
      "./tests/fixture_hmr/dev.ts",
      async (page, address) => {
        const logs: string[] = [];
        page.on("console", (msg) => logs.push(msg.text()));

        await page.goto(`${address}/form_get`);
        await page.waitForSelector("h1");

        await page.type("input", "foo");
        await page.click("button");
        await waitFor(async () => {
          const txt = await page.$eval("input", (el) => el.value);
          return txt === "foo_foo";
        });

        assert(
          logs.length === 2 &&
            logs.every((msg) => /Connected to development/.test(msg)),
          `Error loading bundle assets`,
        );
      },
    );
  },
});
