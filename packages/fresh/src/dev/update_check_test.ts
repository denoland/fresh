import * as path from "@std/path";
import denoJson from "../../deno.json" with { type: "json" };
import { getStdOutput } from "@fresh/internal/test-utils";
import { expect } from "@std/expect";
import { withTmpDir } from "../test_utils.ts";
import type { CheckFile } from "./update_check.ts";
import { WEEK } from "../constants.ts";
import { retry } from "@std/async/retry";

const CURRENT_VERSION = denoJson.version;

const cwd = import.meta.dirname!;

Deno.test("stores update check file in $HOME/fresh", async () => {
  await using tmp = await withTmpDir();
  const filePath = path.join(tmp.dir, "latest.json");

  await new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A",
      path.join(cwd, "../../tests/fixture_update_check/mod.ts"),
    ],
    cwd,
    env: {
      CI: "false",
      TEST_HOME: tmp.dir,
    },
  }).output();

  const text = JSON.parse(await Deno.readTextFile(filePath));
  expect(text).toEqual({
    current_version: CURRENT_VERSION,
    latest_version: "99.99.999",
    last_checked: text.last_checked,
    last_shown: text.last_shown,
  });
});

Deno.test("skips update check on specific environment variables", async (t) => {
  const envs = ["FRESH_NO_UPDATE_CHECK", "CI", "DENO_DEPLOYMENT_ID"];

  for (const env of envs) {
    await t.step(`checking ${env}`, async () => {
      await using tmp = await withTmpDir();
      const out = await new Deno.Command(Deno.execPath(), {
        args: [
          "run",
          "-A",
          path.join(cwd, "../../tests/fixture_update_check/mod.ts"),
        ],
        cwd,
        env: {
          [env]: "true",
          TEST_HOME: tmp.dir,
          LATEST_VERSION: "1.30.0",
        },
        stderr: "piped",
        stdout: "piped",
      }).output();

      const { stdout } = getStdOutput(out);
      expect(stdout).not.toMatch(/Fresh 1\.30\.0 is available/);
    });
  }
});

Deno.test("shows update message on version mismatch", async () => {
  await using tmp = await withTmpDir();
  const filePath = path.join(tmp.dir, "latest.json");

  await Deno.writeTextFile(
    filePath,
    JSON.stringify({
      current_version: "1.1.0",
      latest_version: "1.1.0",
      last_checked: new Date(0).toISOString(),
    }),
  );

  const out = await new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A",
      path.join(cwd, "../../tests/fixture_update_check/mod.ts"),
    ],
    cwd,
    env: {
      CI: "false",
      TEST_HOME: tmp.dir,
      LATEST_VERSION: "999.999.0",
    },
    stderr: "piped",
    stdout: "piped",
  }).output();

  const { stdout } = getStdOutput(out);
  expect(stdout).toMatch(/Fresh 999\.999\.0 is available/);

  // Updates check file
  const text = JSON.parse(await Deno.readTextFile(filePath));
  expect(text).toEqual({
    current_version: CURRENT_VERSION,
    latest_version: "999.999.0",
    last_checked: text.last_checked,
    last_shown: text.last_shown,
  });
});

Deno.test("only fetch new version defined by interval", async (t) => {
  await using tmp = await withTmpDir();

  await t.step("fetches latest version initially", async () => {
    const out = await new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "-A",
        path.join(cwd, "../../tests/fixture_update_check/mod.ts"),
      ],
      cwd,
      env: {
        CI: "false",
        UPDATE_INTERVAL: "100000",
        TEST_HOME: tmp.dir,
        LATEST_VERSION: "1.30.0",
      },
      stderr: "piped",
      stdout: "piped",
    }).output();

    const { stdout } = getStdOutput(out);
    expect(stdout).toMatch(/fetching latest version/);
  });

  await t.step("should not fetch if interval has not passed", async () => {
    const out = await new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "-A",
        path.join(cwd, "../../tests/fixture_update_check/mod.ts"),
      ],
      cwd,
      env: {
        CI: "false",
        UPDATE_INTERVAL: "100000",
        TEST_HOME: tmp.dir,
        LATEST_VERSION: "1.30.0",
      },
      stderr: "piped",
      stdout: "piped",
    }).output();

    const { stdout } = getStdOutput(out);
    expect(stdout).not.toMatch(/fetching latest version/);
  });

  await t.step("fetches if interval has passed", async () => {
    const out = await new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "-A",
        path.join(cwd, "../../tests/fixture_update_check/mod.ts"),
      ],
      cwd,
      env: {
        CI: "false",
        UPDATE_INTERVAL: "1 ",
        TEST_HOME: tmp.dir,
        LATEST_VERSION: "1.30.0",
      },
    }).output();

    const { stdout } = getStdOutput(out);
    expect(stdout).toMatch(/fetching latest version/);
  });
});

Deno.test("updates current version in cache file", async () => {
  await using tmp = await withTmpDir();

  const checkFile: CheckFile = {
    current_version: "1.2.0",
    latest_version: "1.2.0",
    last_checked: new Date(Date.now() - WEEK).toISOString(),
  };

  await Deno.writeTextFile(
    path.join(tmp.dir, "latest.json"),
    JSON.stringify(checkFile, null, 2),
  );

  const out = await new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A",
      path.join(cwd, "../../tests/fixture_update_check/mod.ts"),
    ],
    cwd,
    env: {
      CI: "false",
      TEST_HOME: tmp.dir,
      LATEST_VERSION: CURRENT_VERSION,
    },
    stderr: "piped",
    stdout: "piped",
  }).output();

  const { stdout } = getStdOutput(out);
  expect(stdout).not.toMatch(/Fresh .* is available/);
});

Deno.test("only shows update message when current < latest", async () => {
  await using tmp = await withTmpDir();

  const checkFile: CheckFile = {
    current_version: "9999.999.0",
    latest_version: "1.2.0",
    last_checked: new Date().toISOString(),
  };

  await Deno.writeTextFile(
    path.join(tmp.dir, "latest.json"),
    JSON.stringify(checkFile, null, 2),
  );

  const out = await new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A",
      path.join(cwd, "../../tests/fixture_update_check/mod.ts"),
    ],
    cwd,
    env: {
      CI: "false",
      TEST_HOME: tmp.dir,
      LATEST_VERSION: CURRENT_VERSION,
      CURRENT_VERSION: "99999.9999.0",
    },
    stderr: "piped",
    stdout: "piped",
  }).output();

  const { stdout } = getStdOutput(out);
  expect(stdout).not.toMatch(/Fresh .* is available/);
});

Deno.test("migrates to last_shown property", async () => {
  await using tmp = await withTmpDir();

  const checkFile: CheckFile = {
    latest_version: "1.4.0",
    current_version: "1.2.0",
    last_checked: new Date().toISOString(),
  };

  await Deno.writeTextFile(
    path.join(tmp.dir, "latest.json"),
    JSON.stringify(checkFile, null, 2),
  );

  const out = await new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A",
      path.join(cwd, "../../tests/fixture_update_check/mod.ts"),
    ],
    cwd,
    env: {
      CI: "false",
      TEST_HOME: tmp.dir,
      CURRENT_VERSION: "1.2.0",
      LATEST_VERSION: "99999.9999.0",
    },
    stderr: "piped",
    stdout: "piped",
  }).output();

  const { stdout, stderr } = getStdOutput(out);
  if (stdout === "") {
    // deno-lint-ignore no-console
    console.log(stderr);
  }
  expect(stdout).toMatch(/Fresh .* is available/);

  const checkFileAfter = JSON.parse(
    await Deno.readTextFile(
      path.join(tmp.dir, "latest.json"),
    ),
  );

  // Check if last version was written
  expect(typeof checkFileAfter.last_shown).toEqual("string");
});

Deno.test("doesn't show update if last_shown + interval >= today", async () => {
  await using tmp = await withTmpDir();

  const todayMinus1Hour = new Date();
  todayMinus1Hour.setHours(todayMinus1Hour.getHours() - 1);

  const checkFile: CheckFile = {
    current_version: "1.2.0",
    latest_version: "1.6.0",
    last_checked: new Date().toISOString(),
    last_shown: todayMinus1Hour.toISOString(),
  };

  await Deno.writeTextFile(
    path.join(tmp.dir, "latest.json"),
    JSON.stringify(checkFile, null, 2),
  );

  const out = await new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A",
      path.join(cwd, "../../tests/fixture_update_check/mod.ts"),
    ],
    cwd,
    env: {
      CI: "false",
      TEST_HOME: tmp.dir,
      CURRENT_VERSION: "1.2.0",
      LATEST_VERSION: "99999.9999.0",
    },
    stderr: "piped",
    stdout: "piped",
  }).output();

  const { stdout } = getStdOutput(out);
  expect(stdout).not.toMatch(/Fresh .* is available/);
});

Deno.test(
  "shows update if last_shown + interval < today",
  async () => {
    await retry(async () => {
      await using tmp = await withTmpDir();

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const checkFile: CheckFile = {
        current_version: "1.2.0",
        latest_version: "99.999.99",
        last_checked: new Date().toISOString(),
        last_shown: yesterday.toISOString(),
      };

      await Deno.writeTextFile(
        path.join(tmp.dir, "latest.json"),
        JSON.stringify(checkFile, null, 2),
      );

      const out = await new Deno.Command(Deno.execPath(), {
        args: [
          "run",
          "-A",
          path.join(cwd, "../../tests/fixture_update_check/mod.ts"),
        ],
        cwd,
        env: {
          CI: "false",
          TEST_HOME: tmp.dir,
          CURRENT_VERSION: CURRENT_VERSION,
          LATEST_VERSION: "99999.9999.0",
        },
        stderr: "piped",
        stdout: "piped",
      }).output();

      const { stdout } = getStdOutput(out);
      expect(stdout).toMatch(/Fresh .* is available/);

      const checkFileAfter = JSON.parse(
        await Deno.readTextFile(
          path.join(tmp.dir, "latest.json"),
        ),
      );

      expect(checkFileAfter.last_shown).not.toEqual(yesterday.toISOString());
    }, { maxAttempts: 5 });
  },
);
