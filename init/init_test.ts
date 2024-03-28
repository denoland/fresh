import { expect } from "@std/expect";
import { initProject, InitStep, type MockTTY } from "./init.ts";
import * as path from "@std/path";

async function withTmpDir(fn: (dir: string) => void | Promise<void>) {
  const dir = await Deno.makeTempDir();

  try {
    await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

function mockUserInput(steps: Record<string, unknown>) {
  const errorOutput: unknown[][] = [];
  const tty: MockTTY = {
    confirm(step, _msg) {
      return Boolean(steps[step]);
    },
    prompt(step, _msg, def) {
      const setting = typeof steps[step] === "string"
        ? steps[step] as string
        : null;
      return setting ?? def ?? null;
    },
    log: () => {},
    logError: (...args) => {
      errorOutput.push(args);
    },
  };
  return {
    errorOutput,
    tty,
  };
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
  await withTmpDir(async (dir) => {
    const mock = mockUserInput({});
    await initProject(dir, [], {}, mock.tty);
  });
});

Deno.test("init - create project dir", async () => {
  await withTmpDir(async (dir) => {
    const mock = mockUserInput({ [InitStep.ProjectName]: "fresh-init" });
    await initProject(dir, [], {}, mock.tty);

    const root = path.join(dir, "fresh-init");
    await expectProjectFile(root, "deno.json");
    await expectProjectFile(root, "main.ts");
    await expectProjectFile(root, "dev.ts");
    await expectProjectFile(root, ".gitignore");
    await expectProjectFile(root, "static/styles.css");
  });
});

Deno.test("init - with tailwind", async () => {
  await withTmpDir(async (dir) => {
    const mock = mockUserInput({
      [InitStep.ProjectName]: ".",
      [InitStep.Tailwind]: true,
    });
    await initProject(dir, [], {}, mock.tty);

    const css = await readProjectFile(dir, "static/styles.css");
    expect(css).toMatch(/@tailwind/);

    const main = await readProjectFile(dir, "main.ts");
    const dev = await readProjectFile(dir, "dev.ts");
    expect(main).not.toMatch(/tailwind/);
    expect(dev).toMatch(/tailwind/);
  });
});

Deno.test("init - with vscode", async () => {
  await withTmpDir(async (dir) => {
    const mock = mockUserInput({
      [InitStep.ProjectName]: ".",
      [InitStep.VSCode]: true,
    });
    await initProject(dir, [], {}, mock.tty);

    await expectProjectFile(dir, ".vscode/settings.json");
    await expectProjectFile(dir, ".vscode/extensions.json");
  });
});
