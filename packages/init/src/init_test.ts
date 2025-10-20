import { expect } from "@std/expect";
import {
  CONFIRM_TAILWIND_MESSAGE,
  CONFIRM_VITE_MESSAGE,
  CONFIRM_VSCODE_MESSAGE,
  HELP_TEXT,
  initProject,
} from "./init.ts";
import * as path from "@std/path";
import { getStdOutput, withBrowser } from "../../fresh/tests/test_utils.tsx";
import { waitForText } from "../../fresh/tests/test_utils.tsx";
import { withChildProcessServer } from "../../fresh/tests/test_utils.tsx";
import { withTmpDir as withTmpDirBase } from "../../fresh/src/test_utils.ts";
import { stub } from "@std/testing/mock";

// deno-lint-ignore no-explicit-any
(globalThis as any).INIT_TEST = true;

function stubPrompt(result: string) {
  return stub(globalThis, "prompt", () => result);
}

function stubConfirm(steps: Record<string, boolean> = {}) {
  return stub(
    globalThis,
    "confirm",
    (message) => message ? steps[message] : false,
  );
}

function stubLogs() {
  return stub(
    console,
    "log",
    () => undefined,
  );
}

function withTmpDir(): Promise<{ dir: string } & AsyncDisposable> {
  // Windows need temporary files in the repository root
  if (Deno.build.os === "windows") {
    const dir = path.join(import.meta.dirname!, "..", "..", "..", "..");
    return withTmpDirBase({ dir, prefix: "tmp_" });
  }
  return withTmpDirBase();
}

async function patchProject(dir: string): Promise<void> {
  const jsonPath = path.join(dir, "deno.json");
  const json = JSON.parse(await Deno.readTextFile(jsonPath));

  json.workspace = [];
  // See https://github.com/denoland/deno/issues/27313
  // json.links = [path.fromFileURL(new URL("../..", import.meta.url))];
  json.links = [new URL("../../fresh", import.meta.url).href];

  // assert with this stricter rule, before adding it to initialized projects
  json.lint.rules.include = ["verbatim-module-syntax"];

  await Deno.writeTextFile(jsonPath, JSON.stringify(json, null, 2) + "\n");
}

async function expectProjectFile(dir: string, pathname: string) {
  const filePath = path.join(dir, ...pathname.split("/").filter(Boolean));
  const stat = await Deno.stat(filePath);
  if (!stat.isFile) {
    throw new Error(`Not a project file: ${filePath}`);
  }
}

async function expectNotProjectFile(dir: string, pathname: string) {
  const filePath = path.join(dir, ...pathname.split("/").filter(Boolean));
  try {
    const stat = await Deno.stat(filePath);
    if (stat.isFile) {
      throw new Error(`A project file but expected it not to be: ${filePath}`);
    }
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }
}

async function readProjectFile(dir: string, pathname: string): Promise<string> {
  const filePath = path.join(dir, ...pathname.split("/").filter(Boolean));
  const content = await Deno.readTextFile(filePath);
  return content;
}

Deno.test("init - show help", async () => {
  using logs = stubLogs();

  await initProject("", [], { help: true });
  const args = logs.calls.flatMap((c) => c.args);
  const out = args.join("\n");
  await initProject("", [], { h: true });

  expect(out).toBe(HELP_TEXT);
  expect(args).toEqual(logs.calls.flatMap((c) => c.args).slice(args.length));
});

Deno.test("init - new project", async () => {
  await using tmp = await withTmpDir();
  using _promptStub = stubPrompt("fresh-init");
  using _confirmStub = stubConfirm();

  await initProject(tmp.dir, [], { builder: true });
});

Deno.test("init - create project dir", async () => {
  await using tmp = await withTmpDir();
  const dir = tmp.dir;
  using _promptStub = stubPrompt("fresh-init");
  using _confirmStub = stubConfirm();
  await initProject(dir, [], { builder: true });

  const root = path.join(dir, "fresh-init");
  await expectProjectFile(root, "deno.json");
  await expectProjectFile(root, "main.ts");
  await expectProjectFile(root, "dev.ts");
  await expectProjectFile(root, ".gitignore");
  await expectProjectFile(root, "static/styles.css");
});

Deno.test("init - with tailwind", async () => {
  await using tmp = await withTmpDir();
  const dir = tmp.dir;
  using _promptStub = stubPrompt(".");
  using _confirmStub = stubConfirm({
    [CONFIRM_TAILWIND_MESSAGE]: true,
  });
  await initProject(dir, [], { builder: true });

  const css = await readProjectFile(dir, "static/styles.css");
  expect(css).toMatch(/@import "tailwindcss"/);

  const main = await readProjectFile(dir, "main.ts");
  const dev = await readProjectFile(dir, "dev.ts");
  expect(main).not.toMatch(/tailwind/);
  expect(dev).toMatch(/tailwind/);
});

Deno.test("init - with vscode", async () => {
  await using tmp = await withTmpDir();
  const dir = tmp.dir;
  using _promptStub = stubPrompt(".");
  using _confirmStub = stubConfirm({
    [CONFIRM_VSCODE_MESSAGE]: true,
  });
  await initProject(dir, [], { builder: true });

  await expectProjectFile(dir, ".vscode/settings.json");
  await expectProjectFile(dir, ".vscode/extensions.json");
});

Deno.test({
  name: "init - fmt, lint, and type check project",
  // Ignore this test on canary due to different formatting
  // behaviours when the formatter changes.
  ignore: Deno.version.deno.includes("+"),
  fn: async () => {
    await using tmp = await withTmpDir();
    const dir = tmp.dir;
    using _promptStub = stubPrompt(".");
    using _confirmStub = stubConfirm();
    await initProject(dir, [], { builder: true });
    await expectProjectFile(dir, "main.ts");
    await expectProjectFile(dir, "dev.ts");

    await patchProject(dir);

    const check = await new Deno.Command(Deno.execPath(), {
      args: ["task", "check"],
      cwd: dir,
      stderr: "inherit",
      stdout: "inherit",
    }).output();
    expect(check.code).toEqual(0);
  },
});

Deno.test(
  "init with tailwind - fmt, lint, and type check project",
  async () => {
    await using tmp = await withTmpDir();
    const dir = tmp.dir;
    using _promptStub = stubPrompt(".");
    using _confirmStub = stubConfirm({
      [CONFIRM_TAILWIND_MESSAGE]: true,
    });

    await initProject(dir, [], { builder: true });
    await expectProjectFile(dir, "main.ts");
    await expectProjectFile(dir, "dev.ts");

    await patchProject(dir);

    const check = await new Deno.Command(Deno.execPath(), {
      args: ["task", "check"],
      cwd: dir,
      stderr: "inherit",
      stdout: "inherit",
    }).output();
    expect(check.code).toEqual(0);
  },
);

Deno.test({
  // TODO: For some reason this test is flaky in GitHub CI. It works when
  // testing locally on windows though. Not sure what's going on.
  ignore: Deno.build.os === "windows" && Deno.env.get("CI") !== undefined,
  name: "init - can start dev server",
  fn: async () => {
    await using tmp = await withTmpDir();
    const dir = tmp.dir;
    using _promptStub = stubPrompt(".");
    using _confirmStub = stubConfirm();
    await initProject(dir, [], { builder: true });
    await expectProjectFile(dir, "main.ts");
    await expectProjectFile(dir, "dev.ts");

    await patchProject(dir);
    await withChildProcessServer(
      { cwd: dir, args: ["task", "dev"] },
      async (address) => {
        await withBrowser(async (page) => {
          await page.goto(address);
          await page.locator("#decrement").click();
          await waitForText(page, "button + p", "2");
        });
      },
    );
  },
});

Deno.test("init - can start built project", async () => {
  await using tmp = await withTmpDir();
  const dir = tmp.dir;
  using _promptStub = stubPrompt(".");
  using _confirmStub = stubConfirm();
  await initProject(dir, [], { builder: true });
  await expectProjectFile(dir, "main.ts");
  await expectProjectFile(dir, "dev.ts");

  await patchProject(dir);

  // Build
  await new Deno.Command(Deno.execPath(), {
    args: ["task", "build"],
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
    cwd: dir,
  }).output();

  await withChildProcessServer(
    { cwd: dir, args: ["serve", "-A", "--port", "0", "_fresh/server.js"] },
    async (address) => {
      await withBrowser(async (page) => {
        await page.goto(address);
        await page.locator("button").click();
        await waitForText(page, "button + p", "2");
      });
    },
  );
});

Deno.test("init - errors on missing build cache in prod", async () => {
  await using tmp = await withTmpDir();
  const dir = tmp.dir;
  using _promptStub = stubPrompt(".");
  using _confirmStub = stubConfirm();
  await initProject(dir, [], { builder: true });
  await expectProjectFile(dir, "main.ts");
  await expectProjectFile(dir, "dev.ts");

  await patchProject(dir);

  const cp = await new Deno.Command(Deno.execPath(), {
    args: ["task", "start"],
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
    cwd: dir,
  }).output();

  const { stderr } = getStdOutput(cp);
  expect(cp.code).toEqual(1);

  expect(stderr).toMatch(/Module not found/);
});

// There is a peerDependency issue with links
Deno.test.ignore("init - vite dev server", async () => {
  await using tmp = await withTmpDir();
  const dir = tmp.dir;
  using _promptStub = stubPrompt(".");
  using _confirmStub = stubConfirm();
  await initProject(dir, [], {});

  await expectProjectFile(dir, "vite.config.ts");
  await expectNotProjectFile(dir, "dev.ts");

  await patchProject(dir);

  await withChildProcessServer(
    { cwd: dir, args: ["task", "dev"] },
    async (address) => {
      await withBrowser(async (page) => {
        await page.goto(address);
        await page.locator("#decrement").click();
        await waitForText(page, "button + p", "2");
      });
    },
  );
});

// There is a peerDependency issue with links
Deno.test.ignore("init - vite build", async () => {
  await using tmp = await withTmpDir();
  const dir = tmp.dir;
  using _promptStub = stubPrompt(".");
  using _confirmStub = stubConfirm();
  await initProject(dir, [], {});

  await expectProjectFile(dir, "vite.config.ts");

  await patchProject(dir);

  // Build
  await new Deno.Command(Deno.execPath(), {
    args: ["task", "build"],
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
    cwd: dir,
  }).output();

  await withChildProcessServer(
    { cwd: dir, args: ["serve", "-A", "--port", "0", "_fresh/server.js"] },
    async (address) => {
      await withBrowser(async (page) => {
        await page.goto(address);
        await page.locator("button").click();
        await waitForText(page, "button + p", "2");
      });
    },
  );
});

Deno.test("init - with vite", async () => {
  await using tmp = await withTmpDir();
  const dir = tmp.dir;
  using _promptStub = stubPrompt(".");
  using _confirmStub = stubConfirm({
    [CONFIRM_VITE_MESSAGE]: true,
  });
  await initProject(dir, [], {});

  await expectProjectFile(dir, "vite.config.ts");
  await expectNotProjectFile(dir, "dev.ts");
});
