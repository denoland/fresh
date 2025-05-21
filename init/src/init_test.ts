import { expect } from "@std/expect";
import {
  CONFIRM_TAILWIND_MESSAGE,
  CONFIRM_VSCODE_MESSAGE,
  initProject,
} from "./init.ts";
import * as path from "@std/path";
import { getStdOutput, withBrowser } from "../../tests/test_utils.tsx";
import { waitForText } from "../../tests/test_utils.tsx";
import { withChildProcessServer } from "../../tests/test_utils.tsx";
import { withTmpDir as withTmpDirBase } from "../../src/test_utils.ts";
import { stub } from "@std/testing/mock";

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

function withTmpDir(): Promise<{ dir: string } & AsyncDisposable> {
  return withTmpDirBase({
    dir: path.join(import.meta.dirname!, "..", ".."),
    prefix: "tmp_",
  });
}

async function patchProject(dir: string): Promise<void> {
  const jsonPath = path.join(dir, "deno.json");
  const json = JSON.parse(await Deno.readTextFile(jsonPath));

  json.workspace = [];
  // See https://github.com/denoland/deno/issues/27313
  // json.patch = [path.fromFileURL(new URL("../..", import.meta.url))];
  json.patch = [new URL("../..", import.meta.url).href];

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

async function readProjectFile(dir: string, pathname: string): Promise<string> {
  const filePath = path.join(dir, ...pathname.split("/").filter(Boolean));
  const content = await Deno.readTextFile(filePath);
  return content;
}

Deno.test("init - new project", async () => {
  await using tmp = await withTmpDir();
  using _promptStub = stubPrompt("fresh-init");
  using _confirmStub = stubConfirm();

  await initProject(tmp.dir, [], {});
});

Deno.test("init - create project dir", async () => {
  await using tmp = await withTmpDir();
  const dir = tmp.dir;
  using _promptStub = stubPrompt("fresh-init");
  using _confirmStub = stubConfirm();
  await initProject(dir, [], {});

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
  await initProject(dir, [], {});

  const css = await readProjectFile(dir, "static/styles.css");
  expect(css).toMatch(/tailwindcss/);

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
  await initProject(dir, [], {});

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
    await initProject(dir, [], {});
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

Deno.test("init with tailwind - fmt, lint, and type check project", async () => {
  await using tmp = await withTmpDir();
  const dir = tmp.dir;
  using _promptStub = stubPrompt(".");
  using _confirmStub = stubConfirm({
    [CONFIRM_TAILWIND_MESSAGE]: true,
  });

  await initProject(dir, [], {});
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
});

Deno.test("init - can start dev server", async () => {
  await using tmp = await withTmpDir();
  const dir = tmp.dir;
  using _promptStub = stubPrompt(".");
  using _confirmStub = stubConfirm();
  await initProject(dir, [], {});
  await expectProjectFile(dir, "main.ts");
  await expectProjectFile(dir, "dev.ts");

  await patchProject(dir);
  await withChildProcessServer(
    dir,
    "dev",
    async (address) => {
      await withBrowser(async (page) => {
        await page.goto(address);
        await page.locator("button").click();
        await waitForText(page, "button + p", "2");
      });
    },
  );
});

Deno.test("init - can start built project", async () => {
  await using tmp = await withTmpDir();
  const dir = tmp.dir;
  using _promptStub = stubPrompt(".");
  using _confirmStub = stubConfirm();
  await initProject(dir, [], {});
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
    dir,
    "start",
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
  await initProject(dir, [], {});
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

  expect(stderr).toMatch(/Found 1 islands, but did not/);
});
