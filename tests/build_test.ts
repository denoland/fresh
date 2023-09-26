import * as path from "$std/path/mod.ts";
import { puppeteer } from "./deps.ts";
import { assert } from "$std/_util/asserts.ts";
import {
  getStdOutput,
  startFreshServer,
  waitForText,
} from "$fresh/tests/test_utils.ts";
import { BuildSnapshotJson } from "$fresh/src/build/mod.ts";
import { assertStringIncludes } from "$std/testing/asserts.ts";
import { assertNotMatch } from "$std/testing/asserts.ts";

function runBuild(fixture: string, subDirPath: string, outDir: string) {
  return new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A",
      path.join(fixture, subDirPath, "dev.ts"),
      "build",
    ],
    env: {
      GITHUB_SHA: "__BUILD_ID__",
      DENO_DEPLOYMENT_ID: "__BUILD_ID__",
      FRESH_TEST_OUTDIR: outDir,
    },
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
  }).output();
}

async function testBuild(
  t: Deno.TestContext,
  fixture: string,
  options: {
    subDirPath?: string;
    outDir?: string;
  } = {},
) {
  const subDirPath = options.subDirPath ?? "";
  const outDir = options.outDir ?? path.join(fixture, subDirPath, "_fresh");

  try {
    await t.step("build snapshot", async () => {
      const res = await runBuild(fixture, subDirPath, outDir);
      const { stdout } = getStdOutput(res);
      assert(
        !/Using snapshot found at/.test(stdout),
        "Using snapshot message was shown during build",
      );

      assert((await Deno.stat(outDir)).isDirectory, "Missing output directory");
    });

    const snapshot = JSON.parse(
      await Deno.readTextFile(path.join(outDir, "snapshot.json")),
    ) as BuildSnapshotJson;

    await t.step("check snapshot file", async () => {
      assert(
        Array.isArray(snapshot.files["island-counter_default.js"]),
        "Island output file not found in snapshot",
      );
      assert(
        Array.isArray(snapshot.files["main.js"]),
        "main.js output file not found in snapshot",
      );
      assert(
        Array.isArray(snapshot.files["signals.js"]),
        "signals.js output file not found in snapshot",
      );

      // Should not include `preact/debug`
      const mainJs = await Deno.readTextFile(path.join(outDir, "main.js"));
      assertNotMatch(mainJs, /Undefined parent passed to render()/);
    });

    await t.step("restore from snapshot", async () => {
      const { lines, serverProcess, address, output } = await startFreshServer({
        args: [
          "run",
          "-A",
          path.join(fixture, subDirPath, "main.ts"),
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

          // Ensure that it uses the build id from the snapshot
          const assetUrls = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll("link")).map(
              (link) => link.href,
            );
            const scripts = Array.from(document.querySelectorAll("script"))
              .filter((script) =>
                script.src && !script.src.endsWith("refresh.js")
              ).map((script) => script.src);

            return [...links, ...scripts];
          });

          for (let i = 0; i < assetUrls.length; i++) {
            assertStringIncludes(assetUrls[i], snapshot.build_id);
          }
        } finally {
          await browser.close();
        }
      } finally {
        serverProcess.kill("SIGTERM");
        await serverProcess.status;

        // Drain the lines stream
        for await (const _ of lines) { /* noop */ }
      }
    });

    await t.step("should not restore from snapshot in dev mode", async () => {
      const { lines, serverProcess, output } = await startFreshServer({
        args: [
          "run",
          "-A",
          path.join(fixture, subDirPath, "dev.ts"),
        ],
      });

      try {
        // Check that restore snapshot message was NOT printed
        assert(
          !output.find((line) => line.includes("Using snapshot found at")),
          "Restoring from snapshot message should not appear in dev mode",
        );
      } finally {
        serverProcess.kill("SIGTERM");
        await serverProcess.status;

        // Drain the lines stream
        for await (const _ of lines) { /* noop */ }
      }
    });
  } finally {
    await Deno.remove(path.join(fixture, subDirPath, "_fresh"), {
      recursive: true,
    });
  }
}

Deno.test("build snapshot and restore from it", async (t) => {
  // Note: If you change the fixture_build directory, you must also update fixture_build_sub_dir
  const fixture = path.join(Deno.cwd(), "tests", "fixture_build");
  await testBuild(t, fixture);
});

Deno.test("build snapshot and restore from it when has sub dirs", async (t) => {
  const fixture = path.join(Deno.cwd(), "tests", "fixture_build_sub_dir");
  await testBuild(t, fixture, { subDirPath: "src" });
});

Deno.test(
  "build snapshot with custom build.outDir",
  async (t) => {
    async function assertOutputDir(outDir: string, out: Deno.CommandOutput) {
      const { stdout, stderr } = getStdOutput(out);

      const msg =
        `Missing output directory: ${outDir}\n\nCLI output:\n${stdout}\n${stderr}`;

      const dir: string | URL = outDir.startsWith("file://")
        ? new URL(outDir)
        : outDir;
      try {
        assert((await Deno.stat(dir)).isDirectory, msg);
      } catch (err) {
        throw new Error(msg, { cause: err });
      }
    }

    await t.step("uses on relative outDir", async () => {
      const fixture = path.join(Deno.cwd(), "tests", "fixture_build_out_dir");
      const out = await runBuild(fixture, "", "./tmp/asdf");
      const outDir = path.join(fixture, "tmp", "asdf");

      await assertOutputDir(outDir, out);
    });

    await t.step("uses absolute outDir", async () => {
      const fixture = path.join(
        Deno.cwd(),
        "tests",
        "fixture_build_out_dir_sub",
      );

      const outDir = path.join(fixture, "tmp");
      const out = await runBuild(fixture, "src", outDir);

      await assertOutputDir(outDir, out);
    });

    await t.step("uses file:// outDir", async () => {
      const fixture = path.join(
        Deno.cwd(),
        "tests",
        "fixture_build_out_dir_sub2",
      );

      const outDirPath = path.join(fixture, "tmp");
      const outDir = path.toFileUrl(outDirPath).href;
      const out = await runBuild(fixture, "src", outDir);
      await assertOutputDir(outDir, out);
    });
  },
);

Deno.test("pass target options", async () => {
  const fixture = path.join(Deno.cwd(), "tests", "fixture_build_target");
  const out = await new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A",
      path.join(fixture, "dev.ts"),
      "build",
    ],
    env: {
      GITHUB_SHA: "__BUILD_ID__",
      DENO_DEPLOYMENT_ID: "__BUILD_ID__",
      FRESH_TEST_TARGET: "es2015",
    },
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
  }).output();

  const { stdout, stderr } = getStdOutput(out);
  const txt = await Deno.readTextFile(
    path.join(fixture, "_fresh", "island-counter_default.js"),
  );

  assertNotMatch(
    txt,
    /\?\?/,
    `Asset contained ?? despite target es2015\n\n${stdout}\n${stderr}`,
  );
});
