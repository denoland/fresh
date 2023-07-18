import * as path from "$std/path/mod.ts";
import {
  assertMatch,
  assertNotMatch,
} from "https://deno.land/std@0.193.0/testing/asserts.ts";
import { Status } from "../src/server/deps.ts";
import {
  assert,
  assertEquals,
  assertStringIncludes,
  delay,
  puppeteer,
  retry,
} from "./deps.ts";
import {
  clickWhenListenerReady,
  startFreshServer,
  waitForText,
} from "./test_utils.ts";

const assertFileExistence = async (files: string[], dirname: string) => {
  for (const filePath of files) {
    const parts = filePath.split("/").slice(1);

    const osFilePath = path.join(dirname, ...parts);
    const stat = await Deno.stat(osFilePath);
    assert(stat.isFile, `Could not find file ${osFilePath}`);
  }
};

Deno.test({
  name: "fresh-init",
  async fn(t) {
    // Preparation
    const tmpDirName = await Deno.makeTempDir();

    await t.step("execute init command", async () => {
      const cliProcess = new Deno.Command(Deno.execPath(), {
        args: [
          "run",
          "-A",
          "init.ts",
          tmpDirName,
        ],
        stdin: "null",
        stdout: "null",
      });
      const { code } = await cliProcess.output();
      assertEquals(code, 0);
    });

    const files = [
      `/README.md`,
      `/fresh.gen.ts`,
      `/components/Button.tsx`,
      `/islands/Counter.tsx`,
      `/main.ts`,
      `/routes/greet/[name].tsx`,
      `/routes/api/joke.ts`,
      `/routes/_app.tsx`,
      `/routes/index.tsx`,
      `/static/logo.svg`,
    ];

    await t.step("check generated files", async () => {
      await assertFileExistence(files, tmpDirName);
    });

    await t.step("start up the server and access the root page", async () => {
      const { serverProcess, lines, address } = await startFreshServer({
        args: ["run", "-A", "--check", "main.ts"],
        cwd: tmpDirName,
      });

      await delay(100);

      // Access the root page
      const res = await fetch(address);
      await res.body?.cancel();
      assertEquals(res.status, Status.OK);

      // verify the island is revived.
      const browser = await puppeteer.launch({
        args: ["--no-sandbox"],
      });
      const page = await browser.newPage();
      await page.goto(address, { waitUntil: "networkidle2" });
      const counter = await page.$("body > div > div > div > p");
      let counterValue = await counter?.evaluate((el) => el.textContent);
      assert(counterValue === "3");

      await clickWhenListenerReady(
        page,
        "body > div > div > div > button:nth-child(3)",
      );

      await waitForText(page, "body > div > div > div > p", "4");

      counterValue = await counter?.evaluate((el) => el.textContent);
      assert(counterValue === "4");
      await page.close();
      await browser.close();

      await lines.cancel();
      serverProcess.kill("SIGTERM");
      await serverProcess.status;
    });

    await retry(() => Deno.remove(tmpDirName, { recursive: true }));
  },
  sanitizeResources: false,
});

Deno.test({
  name: "fresh-init --twind --vscode",
  async fn(t) {
    // Preparation
    const tmpDirName = await Deno.makeTempDir();

    await t.step("execute init command", async () => {
      const cliProcess = new Deno.Command(Deno.execPath(), {
        args: [
          "run",
          "-A",
          "init.ts",
          tmpDirName,
          "--twind",
          "--vscode",
        ],
        stdin: "null",
        stdout: "null",
      });
      const { code } = await cliProcess.output();
      assertEquals(code, 0);
    });

    const files = [
      "/README.md",
      "/fresh.gen.ts",
      "/twind.config.ts",
      "/components/Button.tsx",
      "/islands/Counter.tsx",
      "/main.ts",
      "/routes/greet/[name].tsx",
      "/routes/api/joke.ts",
      "/routes/_app.tsx",
      "/routes/index.tsx",
      "/static/logo.svg",
      "/.vscode/settings.json",
      "/.vscode/extensions.json",
      "/.gitignore",
    ];

    await t.step("check generated files", async () => {
      await assertFileExistence(files, tmpDirName);
    });

    await t.step("start up the server and access the root page", async () => {
      const { serverProcess, lines, address } = await startFreshServer({
        args: ["run", "-A", "--check", "main.ts"],
        cwd: tmpDirName,
      });

      await delay(100);

      // Access the root page
      const res = await fetch(address);
      await res.body?.cancel();
      assertEquals(res.status, Status.OK);

      // verify the island is revived.
      const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
      const page = await browser.newPage();
      await page.goto(address, { waitUntil: "networkidle2" });

      const counter = await page.$("body > div > div > div > p");
      let counterValue = await counter?.evaluate((el) => el.textContent);
      assertEquals(counterValue, "3");

      const fontWeight = await counter?.evaluate((el) =>
        getComputedStyle(el).fontWeight
      );
      assertEquals(fontWeight, "400");

      const buttonPlus = await page.$(
        "body > div > div > div > button:nth-child(3)",
      );
      await buttonPlus?.click();

      await waitForText(page, "body > div > div > div > p", "4");

      counterValue = await counter?.evaluate((el) => el.textContent);
      assert(counterValue === "4");
      await page.close();
      await browser.close();

      await lines.cancel();
      serverProcess.kill("SIGTERM");
      await serverProcess.status;
    });

    await retry(() => Deno.remove(tmpDirName, { recursive: true }));
  },
  sanitizeResources: false,
});

Deno.test("fresh-init error(help)", async function (t) {
  const includeText = "fresh-init";

  await t.step(
    "execute invalid init command (deno run -A init.ts)",
    async () => {
      const cliProcess = new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", "init.ts"],
        stdin: "null",
        stderr: "piped",
      });
      const { code, stderr } = await cliProcess.output();
      assertEquals(code, 1);

      const errorString = new TextDecoder().decode(stderr);
      assertStringIncludes(errorString, includeText);
    },
  );

  await t.step(
    "execute invalid init command (deno run -A init.ts -f)",
    async () => {
      const cliProcess = new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", "init.ts", "-f"],
      });
      const { code, stderr } = await cliProcess.output();
      assertEquals(code, 1);

      const errorString = new TextDecoder().decode(stderr);
      assertStringIncludes(errorString, includeText);
    },
  );

  await t.step(
    "execute invalid init command (deno run -A init.ts --foo)",
    async () => {
      const cliProcess = new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", "init.ts", "--foo"],
      });
      const { code, stderr } = await cliProcess.output();
      assertEquals(code, 1);

      const errorString = new TextDecoder().decode(stderr);
      assertStringIncludes(errorString, includeText);
    },
  );
});

Deno.test("fresh-init .", async function (t) {
  // Preparation
  const tmpDirName = await Deno.makeTempDir();

  await t.step("execute init command", async () => {
    const cliProcess = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "-A",
        path.join(Deno.cwd(), "init.ts"),
        ".",
      ],
      cwd: tmpDirName,
      stdin: "null",
      stdout: "piped",
      stderr: "piped",
    });
    const { code, stdout } = await cliProcess.output();
    const output = new TextDecoder().decode(stdout);
    assertNotMatch(output, /Enter your project directory/);
    assertEquals(code, 0);
  });
});

Deno.test({
  name: "fresh-init subdirectory",
  async fn(t) {
    // Preparation
    const tmpDirName = await Deno.makeTempDir();

    await Deno.mkdir(path.join(tmpDirName, "subdirectory"));

    const cliProcess = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "-A",
        path.join(Deno.cwd(), "init.ts"),
        "subdirectory/subsubdirectory",
      ],
      cwd: tmpDirName,
      stdin: "null",
      stdout: "piped",
      stderr: "inherit",
    });

    await cliProcess.output();

    // move deno.json one level up
    await Deno.rename(
      path.join(tmpDirName, "subdirectory", "subsubdirectory", "deno.json"),
      path.join(tmpDirName, "deno.json"),
    );

    const files = [
      "/deno.json",
      "/subdirectory/subsubdirectory/main.ts",
      "/subdirectory/subsubdirectory/dev.ts",
      "/subdirectory/subsubdirectory/fresh.gen.ts",
    ];

    await t.step("check generated files", async () => {
      await assertFileExistence(files, tmpDirName);
    });

    await t.step("start up the server", async () => {
      const { serverProcess, lines } = await startFreshServer({
        args: ["run", "-A", "--check", "subdirectory/subsubdirectory/dev.ts"],
        cwd: tmpDirName,
      });

      await delay(100);

      await lines.cancel();
      serverProcess.kill("SIGTERM");
      await serverProcess.status;
    });

    await retry(() => Deno.remove(tmpDirName, { recursive: true }));
  },
  sanitizeResources: false,
});

Deno.test("fresh-update", async function fn(t) {
  // Preparation
  const tmpDirName = await Deno.makeTempDir();

  const cliProcess = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A",
      path.join(Deno.cwd(), "init.ts"),
      ".",
    ],
    cwd: tmpDirName,
    stdin: "null",
    stdout: "null",
  });

  await cliProcess.output();

  await t.step("execute update command", async () => {
    await updateAndVerify(
      /The manifest has been generated for \d+ routes and \d+ islands./,
    );
  });

  await t.step("execute update command deno.jsonc support", async () => {
    try {
      Deno.renameSync(`${tmpDirName}/deno.json`, `${tmpDirName}/deno.jsonc`);
      await updateAndVerify(
        /The manifest has been generated for \d+ routes and \d+ islands./,
      );
    } finally {
      Deno.renameSync(`${tmpDirName}/deno.jsonc`, `${tmpDirName}/deno.json`);
    }
  });

  await t.step("execute update command src dir", async () => {
    const names = [
      "components",
      "islands",
      "routes",
      "static",
      "dev.ts",
      "main.ts",
      "fresh.gen.ts",
    ];
    try {
      Deno.mkdirSync(tmpDirName + "/src");
      names.forEach((x) => {
        Deno.renameSync(
          path.join(tmpDirName, x),
          path.join(tmpDirName, "src", x),
        );
      });
      await updateAndVerify(
        /The manifest has been generated for (?!0 routes and 0 islands)\d+ routes and \d+ islands./,
      );
    } finally {
      names.forEach((x) => {
        Deno.renameSync(
          path.join(tmpDirName, "src", x),
          path.join(tmpDirName, x),
        );
      });
      Deno.removeSync(tmpDirName + "/src", { recursive: true });
    }
  });

  await t.step("execute update command (no islands directory)", async () => {
    await retry(() =>
      Deno.remove(path.join(tmpDirName, "islands"), { recursive: true })
    );
    await updateAndVerify(
      /The manifest has been generated for \d+ routes and 0 islands./,
    );
  });

  await retry(() => Deno.remove(tmpDirName, { recursive: true }));

  async function updateAndVerify(expected: RegExp) {
    const cliProcess = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "-A",
        path.join(Deno.cwd(), "update.ts"),
        ".",
      ],
      cwd: tmpDirName,
      stdin: "null",
      stdout: "piped",
    });

    const { code, stdout } = await cliProcess.output();
    const output = new TextDecoder().decode(stdout);

    assertMatch(
      output,
      expected,
    );
    assertEquals(code, 0);
  }
});
