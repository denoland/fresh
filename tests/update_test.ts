import * as path from "$std/path/mod.ts";
import { DenoConfig } from "$fresh/server.ts";
import { JSONC } from "../src/server/deps.ts";
import {
  assertEquals,
  assertExists,
  assertMatch,
  assertRejects,
  assertStringIncludes,
  retry,
} from "./deps.ts";

async function updateAndVerify(cwd: string | URL, expected: RegExp) {
  const cliProcess = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A",
      path.join(Deno.cwd(), "update.ts"),
      ".",
    ],
    cwd,
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

async function initProject() {
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

  return tmpDirName;
}

async function executeUpdateCommand(t: Deno.TestContext, tmpDirName: string) {
  await t.step("execute update command", async () => {
    await updateAndVerify(
      tmpDirName,
      /The manifest has been generated for \d+ routes and \d+ islands./,
    );
  });
}

Deno.test("fresh-update", async function fn(t) {
  // Preparation
  const tmpDirName = await initProject();
  await executeUpdateCommand(t, tmpDirName);

  await t.step("check deno.json", async () => {
    const configPath = path.join(tmpDirName, "deno.json");
    const json = JSONC.parse(await Deno.readTextFile(configPath)) as DenoConfig;

    assertExists(json.tasks?.start, "Missing 'start' task");
    assertExists(json.tasks?.build, "Missing 'build' task");
    assertExists(json.tasks?.preview, "Missing 'preview' task");

    assertEquals(json.lint?.rules?.tags, ["fresh", "recommended"]);
    assertEquals(json.exclude, ["**/_fresh/*"]);
  });

  const comment = "// This is a test comment";
  const regex = /("preact": "https:\/\/esm.sh\/preact@[\d.]+",\n)/;
  const originalName = `${tmpDirName}/deno.json`;
  const updatedName = `${originalName}c`;

  await t.step("execute update command deno.jsonc support", async () => {
    try {
      Deno.renameSync(originalName, updatedName);
      let denoJsonText = await Deno.readTextFile(updatedName);
      denoJsonText = denoJsonText.replace(regex, `$1${comment}\n`);
      await Deno.writeTextFile(updatedName, denoJsonText);
      await updateAndVerify(
        tmpDirName,
        /The manifest has been generated for \d+ routes and \d+ islands./,
      );
    } finally {
      let denoJsonText = await Deno.readTextFile(updatedName);
      denoJsonText = denoJsonText.replace(new RegExp(`\n${comment}\n`), "\n");
      await Deno.writeTextFile(updatedName, denoJsonText);
      Deno.renameSync(updatedName, originalName);
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
        tmpDirName,
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
      tmpDirName,
      /The manifest has been generated for \d+ routes and 0 islands./,
    );
  });

  await retry(() => Deno.remove(tmpDirName, { recursive: true }));
});

Deno.test("fresh-update add _app.tsx if not present", async function fn(t) {
  // Preparation
  const tmpDirName = await initProject();

  const appTsx = path.join(tmpDirName, "routes", "_app.tsx");
  await Deno.remove(appTsx);

  await executeUpdateCommand(t, tmpDirName);

  await t.step("add _app.tsx", async () => {
    const raw = await Deno.readTextFile(appTsx);
    assertStringIncludes(raw, "<html>", `<html>-tag not found in _app.tsx`);
  });
});

Deno.test(
  "fresh-update add _fresh to .gitignore if not present",
  async function fn(t) {
    // Preparation
    const tmpDirName = await initProject();

    const gitignore = path.join(tmpDirName, ".gitignore");
    await Deno.writeTextFile(gitignore, ""); // clear .gitignore

    await executeUpdateCommand(t, tmpDirName);

    await t.step("append _fresh to .gitignore", async () => {
      const raw = await Deno.readTextFile(gitignore);
      assertStringIncludes(raw, "_fresh", "_fresh not found in .gitignore");
    });
  },
);

Deno.test(
  "fresh-update do not add _fresh to .gitignore if already present",
  async function fn(t) {
    // Preparation
    const tmpDirName = await initProject();

    const gitignore = path.join(tmpDirName, ".gitignore");
    await Deno.writeTextFile(gitignore, "_fresh");

    await executeUpdateCommand(t, tmpDirName);

    await t.step("do not append _fresh to .gitignore", async () => {
      const raw = await Deno.readTextFile(gitignore);
      // Count the number of times "_fresh" appears in .gitignore
      const count = (raw.match(/_fresh/g) ?? []).length;
      assertEquals(count, 1, "extra _fresh found in .gitignore");
    });
  },
);

Deno.test(
  "fresh-update do not create a .gitignore if none exist",
  async function fn(t) {
    // Preparation
    const tmpDirName = await initProject();

    const gitignore = path.join(tmpDirName, ".gitignore");
    await Deno.remove(gitignore);

    await executeUpdateCommand(t, tmpDirName);

    await t.step("do not create a .gitignore", async () => {
      await assertRejects(
        () => Deno.open(gitignore),
        Deno.errors.NotFound,
        undefined,
        "found .gitignore",
      );
    });
  },
);

Deno.test(
  "fresh-update migrates old exclude to top level exclude",
  async (t) => {
    // Preparation
    const tmpDirName = await initProject();
    const denoJsonFile = path.join(tmpDirName, "deno.json");
    const denoJson = JSON.parse(await Deno.readTextFile(denoJsonFile));
    delete denoJson.exclude;
    if (!denoJson.fmt) denoJson.fmt = {};
    if (!denoJson.lint) denoJson.lint = {};
    denoJson.fmt.exclude = ["_fresh"];
    denoJson.lint.exclude = ["_fresh"];
    await Deno.writeTextFile(denoJsonFile, JSON.stringify(denoJson, null, 2));

    await executeUpdateCommand(t, tmpDirName);

    const denoJsonAfter = JSON.parse(Deno.readTextFileSync(denoJsonFile));
    assertEquals(denoJsonAfter.exclude, ["**/_fresh/*"]);
    assertEquals(denoJsonAfter.lint, {
      rules: { tags: ["fresh", "recommended"] },
    });
    assertEquals(denoJsonAfter.fmt, undefined);
  },
);
