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
  // json.links = [path.fromFileURL(new URL("../..", import.meta.url))];
  json.links = [new URL("../..", import.meta.url).href];

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

Deno.test("init", async (t) => {
  await using tmp = await withTmpDir();
  const dir = tmp.dir;
  using _promptStub = stubPrompt("fresh-init");
  using _confirmStub = stubConfirm();
  const cwd = path.join(dir, "fresh-init");

  await t.step("should create a project directory", async () => {
    await initProject(dir, [], {});
    await patchProject(cwd);
  });

  await t.step("should create a project directory", async () => {
    await expectProjectFile(cwd, "deno.json");
    await expectProjectFile(cwd, "main.ts");
    await expectProjectFile(cwd, "dev.ts");
    await expectProjectFile(cwd, ".gitignore");
    await expectProjectFile(cwd, "static/styles.css");
  });

  await t.step("should format, lint and type check successfully", async () => {
    const check = await new Deno.Command(Deno.execPath(), {
      args: ["task", "check"],
      cwd,
      stderr: "inherit",
      stdout: "inherit",
    }).output();
    expect(check.code).toEqual(0);
  });

  await t.step("should start dev server", async () => {
    await withChildProcessServer(
      cwd,
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

  await t.step("should error on missing build cache in dev", async () => {
    const cp = await new Deno.Command(Deno.execPath(), {
      args: ["task", "start"],
      stdin: "null",
      stdout: "piped",
      stderr: "piped",
      cwd,
    }).output();

    const { stderr } = getStdOutput(cp);
    expect(cp.code).toEqual(1);
    expect(stderr).toMatch(/Found 1 islands, but did not/);
  });

  await t.step("should start built project", async () => {
    await new Deno.Command(Deno.execPath(), {
      args: ["task", "build"],
      stdin: "null",
      stdout: "piped",
      stderr: "piped",
      cwd,
    }).output();
    await withChildProcessServer(
      cwd,
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
});

Deno.test("init - with tailwind", async (t) => {
  await using tmp = await withTmpDir();
  const dir = tmp.dir;
  using _promptStub = stubPrompt(".");
  using _confirmStub = stubConfirm({
    [CONFIRM_TAILWIND_MESSAGE]: true,
  });

  await t.step("should create a project directory", async () => {
    await initProject(dir, [], {});
    await patchProject(dir);
  });

  await t.step("should create the correct project files", async () => {
    const css = await readProjectFile(dir, "static/styles.css");
    expect(css).toMatch(/@tailwind/);

    const main = await readProjectFile(dir, "main.ts");
    const dev = await readProjectFile(dir, "dev.ts");
    expect(main).not.toMatch(/tailwind/);
    expect(dev).toMatch(/tailwind/);
  });

  await t.step("should format, lint and type check successfully", async () => {
    const check = await new Deno.Command(Deno.execPath(), {
      args: ["task", "check"],
      cwd: dir,
      stderr: "inherit",
      stdout: "inherit",
    }).output();
    expect(check.code).toEqual(0);
  });
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
