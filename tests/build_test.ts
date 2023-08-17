import * as path from "$std/path/mod.ts";
import { puppeteer } from "./deps.ts";
import { assert } from "$std/_util/asserts.ts";
import { startFreshServer, waitForText } from "$fresh/tests/test_utils.ts";

Deno.test("build snapshot and restore from it", async (t) => {
  const fixture = path.join(Deno.cwd(), "tests", "fixture_build");
  const outDir = path.join(fixture, "_fresh");

  try {
    await t.step("build snapshot", async () => {
      const res = await new Deno.Command(Deno.execPath(), {
        args: [
          "run",
          "-A",
          path.join(fixture, "dev.ts"),
          "build",
        ],
        stdin: "null",
        stdout: "piped",
        stderr: "inherit",
      }).output();

      const decoder = new TextDecoder();
      const stdout = decoder.decode(res.stdout);
      assert(
        !/Using snapshot found at/.test(stdout),
        "Using snapshot message was shown during build",
      );

      assert((await Deno.stat(outDir)).isDirectory, "Missing output directory");
    });

    await t.step("check snapshot file", async () => {
      const snapshot = JSON.parse(
        await Deno.readTextFile(path.join(outDir, "snapshot.json")),
      );
      assert(
        Array.isArray(snapshot["island-counter_default.js"]),
        "Island output file not found in snapshot",
      );
      assert(
        Array.isArray(snapshot["main.js"]),
        "main.js output file not found in snapshot",
      );
      assert(
        Array.isArray(snapshot["signals.js"]),
        "signals.js output file not found in snapshot",
      );
      assert(
        Array.isArray(snapshot["deserializer.js"]),
        "deserializer.js output file not found in snapshot",
      );
    });

    await t.step("restore from snapshot", async () => {
      const { lines, serverProcess, address, output } = await startFreshServer({
        args: [
          "run",
          "-A",
          path.join(fixture, "./main.ts"),
        ],
      });

      // Check if restore snapshot message was printed
      assert(
        output.find((line) => line.includes("Using snapshot found at")),
        "Did not print restoring from snapshot line",
      );

      try {
        const browser = await puppeteer.launch({ args: ["--no-sandbox"] });

        try {
          const page = await browser.newPage();
          await page.goto(address);

          await page.waitForSelector("button:not([disabled])");
          await page.click("button");

          await waitForText(page, "p", "1");
        } finally {
          await browser.close();
        }
      } finally {
        await lines.cancel();
        serverProcess.kill("SIGTERM");
        await serverProcess.status;
      }
    });
  } finally {
    await Deno.remove(path.join(fixture, "_fresh"), { recursive: true });
  }
});
