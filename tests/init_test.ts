import * as path from "$std/path/mod.ts";
import { STATUS_CODE } from "../src/server/deps.ts";
import {
  assert,
  assertEquals,
  assertNotMatch,
  assertStringIncludes,
  delay,
  puppeteer,
  retry,
} from "./deps.ts";
import {
  assertTextMany,
  clickWhenListenerReady,
  fetchHtml,
  getStdOutput,
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
          "--no-config",
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
      `/.gitignore`,
      `/deno.json`,
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

    await t.step("check project", async () => {
      const cliProcess = new Deno.Command(Deno.execPath(), {
        args: [
          "task",
          "check",
        ],
        cwd: tmpDirName,
        stdin: "null",
        stdout: "piped",
        stderr: "piped",
      });
      const { code } = await cliProcess.output();
      assertEquals(code, 0);
    });

    await t.step("check deno.json", async () => {
      const configPath = path.join(tmpDirName, "deno.json");
      const json = JSON.parse(await Deno.readTextFile(configPath));

      // Check tasks
      assert(json.tasks.start, "Missing 'start' task");
      assert(json.tasks.build, "Missing 'build' task");
      assert(json.tasks.preview, "Missing 'preview' task");

      // Check lint settings
      assertEquals(json.lint.rules.tags, ["fresh", "recommended"]);

      // Check exclude settings
      assertEquals(json.exclude, ["**/_fresh/*"]);
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
      assertEquals(res.status, STATUS_CODE.OK);

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

      serverProcess.kill("SIGTERM");
      await serverProcess.status;

      // Drain the lines stream
      for await (const _ of lines) { /* noop */ }
    });

    await retry(() => Deno.remove(tmpDirName, { recursive: true }));
  },
});

Deno.test({
  name: "fresh-init --tailwind --vscode",
  async fn(t) {
    // Preparation
    const tmpDirName = await Deno.makeTempDir();

    await t.step("execute init command", async () => {
      const cliProcess = new Deno.Command(Deno.execPath(), {
        args: [
          "run",
          "-A",
          "--no-config",
          "init.ts",
          tmpDirName,
          "--tailwind",
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
      "/tailwind.config.ts",
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
      "/.github/workflows/deploy.yml",
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
      assertEquals(res.status, STATUS_CODE.OK);

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

      serverProcess.kill("SIGTERM");
      await serverProcess.status;

      // Drain the lines stream
      for await (const _ of lines) { /* noop */ }
    });

    await retry(() => Deno.remove(tmpDirName, { recursive: true }));
  },
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
      assertEquals(res.status, STATUS_CODE.OK);

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

      serverProcess.kill("SIGTERM");
      await serverProcess.status;

      // Drain the lines stream
      for await (const _ of lines) { /* noop */ }
    });

    await retry(() => Deno.remove(tmpDirName, { recursive: true }));
  },
});

Deno.test("fresh-init error(help)", async function (t) {
  const includeText = "fresh-init";

  await t.step(
    "execute invalid init command (deno run -A init.ts)",
    async () => {
      const cliProcess = new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", "--no-config", "init.ts"],
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
        args: ["run", "-A", "--no-config", "init.ts", "-f"],
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
        args: ["run", "-A", "--no-config", "init.ts", "--foo"],
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
        "--no-config",
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
        "--no-config",
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

      serverProcess.kill("SIGTERM");
      await serverProcess.status;

      // Drain the lines stream
      for await (const _ of lines) { /* noop */ }
    });

    await retry(() => Deno.remove(tmpDirName, { recursive: true }));
  },
});

Deno.test({
  name: "fresh-init loads env variables",
  async fn(t) {
    // Preparation
    const tmpDirName = await Deno.makeTempDir();

    const cliProcess = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "-A",
        "--no-config",
        "init.ts",
        tmpDirName,
        "--tailwind",
        "--vscode",
      ],
      stdin: "null",
      stdout: "piped",
      stderr: "inherit",
    });

    await cliProcess.output();

    // Add .env file
    await Deno.writeTextFile(path.join(tmpDirName, ".env"), "FOO=true\n");
    await Deno.writeTextFile(
      path.join(tmpDirName, "routes", "env.tsx"),
      `export default function Page() { return <h1>{Deno.env.get("FOO")}</h1> }`,
    );

    await t.step("start up the server", async () => {
      const { serverProcess, lines, address } = await startFreshServer({
        args: ["run", "-A", "--no-check", "dev.ts"],
        cwd: tmpDirName,
      });

      const doc = await fetchHtml(`${address}/env`);
      assertTextMany(doc, "h1", ["true"]);

      serverProcess.kill("SIGTERM");
      await serverProcess.status;

      // Drain the lines stream
      for await (const _ of lines) { /* noop */ }
    });

    await t.step("build code and start server again", async () => {
      await new Deno.Command(Deno.execPath(), {
        args: [
          "task",
          "build",
        ],
        cwd: tmpDirName,
        stdin: "null",
        stdout: "piped",
        stderr: "inherit",
      }).output();

      const { serverProcess, lines, address, output } = await startFreshServer({
        args: ["run", "-A", "--no-check", "main.ts"],
        cwd: tmpDirName,
      });

      assert(
        output.find((line) => /Using snapshot found a/.test(line)),
        "Snapshot message not printed",
      );

      const doc = await fetchHtml(`${address}/env`);
      assertTextMany(doc, "h1", ["true"]);

      serverProcess.kill("SIGTERM");
      await serverProcess.status;

      // Drain the lines stream
      for await (const _ of lines) { /* noop */ }
    });

    await retry(() => Deno.remove(tmpDirName, { recursive: true }));
  },
});

Deno.test("init - show help screen", async (t) => {
  await t.step("--help", async () => {
    const output1 = await new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "-A",
        "--no-config",
        "init.ts",
        "--help",
      ],
      stdin: "null",
      stdout: "piped",
      stderr: "piped",
    }).output();

    assertEquals(output1.code, 0);
    const { stdout } = getStdOutput(output1);
    assertStringIncludes(stdout, "Initialize a new Fresh project");
  });

  await t.step("-h", async () => {
    const output1 = await new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "-A",
        "--no-config",
        "init.ts",
        "-h",
      ],
      stdin: "null",
      stdout: "piped",
      stderr: "piped",
    }).output();

    assertEquals(output1.code, 0);
    const { stdout } = getStdOutput(output1);
    assertStringIncludes(stdout, "Initialize a new Fresh project");
  });
});

Deno.test({
  name: "regenerate manifest",
  async fn(t) {
    const MANIFEST_FILENAME = "fresh.gen.ts";
    const tmpDirName = await Deno.makeTempDir();
    const manifestFilePath = path.join(tmpDirName, MANIFEST_FILENAME);

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

    let oldManifestContent: string;
    await t.step("store the contents of the manifest", async () => {
      oldManifestContent = await Deno.readTextFile(manifestFilePath);
    });

    await t.step("delete the manifest", async () => {
      await Deno.remove(manifestFilePath);
    });

    await t.step("regenerate the manifest", async () => {
      const cliProcess = new Deno.Command(Deno.execPath(), {
        args: [
          "task",
          "manifest",
        ],
        cwd: tmpDirName,
        stdin: "null",
        stdout: "piped",
        stderr: "piped",
      });

      const output = await cliProcess.output();

      assertEquals(output.code, 0);
    });

    await t.step("assert the old and new contents are equal", async () => {
      const newManifestContent = await Deno.readTextFile(manifestFilePath);
      assertEquals(oldManifestContent, newManifestContent);
    });

    await retry(() => Deno.remove(tmpDirName, { recursive: true }));
  },
  sanitizeResources: false,
});
