import { join } from "../src/server/deps.ts";
import {
  assert,
  assertEquals,
  assertMatch,
  assertNotEquals,
  assertNotMatch,
} from "./deps.ts";
import versions from "../versions.json" with { type: "json" };
import { CheckFile } from "../src/dev/update_check.ts";
import { WEEK } from "../src/dev/deps.ts";
import { getStdOutput } from "../tests/test_utils.ts";

Deno.test({
  name: "stores update check file in $HOME/fresh",
  async fn() {
    const tmpDirName = await Deno.makeTempDir();
    const filePath = join(tmpDirName, "latest.json");

    await new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "./tests/fixture_update_check/mod.ts"],
      env: {
        CI: "false",
        TEST_HOME: tmpDirName,
      },
    }).output();

    const text = JSON.parse(await Deno.readTextFile(filePath));
    assertEquals(text, {
      current_version: versions[0],
      latest_version: "99.99.999",
      last_checked: text.last_checked,
      last_shown: text.last_shown,
    });

    await Deno.remove(tmpDirName, { recursive: true });
  },
});

Deno.test({
  name: "skips update check on specific environment variables",
  async fn(t) {
    const envs = ["FRESH_NO_UPDATE_CHECK", "CI", "DENO_DEPLOYMENT_ID"];

    for (const env of envs) {
      await t.step(`checking ${env}`, async () => {
        const tmpDirName = await Deno.makeTempDir();
        const out = await new Deno.Command(Deno.execPath(), {
          args: ["run", "-A", "./tests/fixture_update_check/mod.ts"],
          env: {
            [env]: "true",
            TEST_HOME: tmpDirName,
            LATEST_VERSION: "1.30.0",
          },
          stderr: "piped",
          stdout: "piped",
        }).output();

        const { stdout } = getStdOutput(out);
        assertNotMatch(stdout, /Fresh 1\.30\.0 is available/);

        await Deno.remove(tmpDirName, { recursive: true });
      });
    }
  },
});

Deno.test({
  name: "shows update message on version mismatch",
  async fn() {
    const tmpDirName = await Deno.makeTempDir();
    const filePath = join(tmpDirName, "latest.json");

    await Deno.writeTextFile(
      filePath,
      JSON.stringify({
        current_version: "1.1.0",
        latest_version: "1.1.0",
        last_checked: new Date(0).toISOString(),
      }),
    );

    const out = await new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "./tests/fixture_update_check/mod.ts"],
      env: {
        CI: "false",
        TEST_HOME: tmpDirName,
        LATEST_VERSION: "999.999.0",
      },
      stderr: "piped",
      stdout: "piped",
    }).output();

    const { stdout } = getStdOutput(out);
    assertMatch(stdout, /Fresh 999\.999\.0 is available/);

    // Updates check file
    const text = JSON.parse(await Deno.readTextFile(filePath));
    assertEquals(text, {
      current_version: versions[0],
      latest_version: "999.999.0",
      last_checked: text.last_checked,
      last_shown: text.last_shown,
    });

    await Deno.remove(tmpDirName, { recursive: true });
  },
});

Deno.test({
  name: "only fetch new version defined by interval",
  async fn(t) {
    const tmpDirName = await Deno.makeTempDir();

    await t.step("fetches latest version initially", async () => {
      const out = await new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", "./tests/fixture_update_check/mod.ts"],
        env: {
          CI: "false",
          UPDATE_INTERVAL: "100000",
          TEST_HOME: tmpDirName,
          LATEST_VERSION: "1.30.0",
        },
        stderr: "piped",
        stdout: "piped",
      }).output();

      const { stdout } = getStdOutput(out);
      assertMatch(stdout, /fetching latest version/);
    });

    await t.step("should not fetch if interval has not passed", async () => {
      const out = await new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", "./tests/fixture_update_check/mod.ts"],
        env: {
          CI: "false",
          UPDATE_INTERVAL: "100000",
          TEST_HOME: tmpDirName,
          LATEST_VERSION: "1.30.0",
        },
        stderr: "piped",
        stdout: "piped",
      }).output();

      const { stdout } = getStdOutput(out);
      assertNotMatch(stdout, /fetching latest version/);
    });

    await t.step("fetches if interval has passed", async () => {
      const out = await new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", "./tests/fixture_update_check/mod.ts"],
        env: {
          CI: "false",
          UPDATE_INTERVAL: "1 ",
          TEST_HOME: tmpDirName,
          LATEST_VERSION: "1.30.0",
        },
      }).output();

      const { stdout } = getStdOutput(out);
      assertMatch(stdout, /fetching latest version/);
    });

    await Deno.remove(tmpDirName, { recursive: true });
  },
});

Deno.test({
  name: "updates current version in cache file",
  async fn() {
    const tmpDirName = await Deno.makeTempDir();

    const checkFile: CheckFile = {
      current_version: "1.2.0",
      latest_version: "1.2.0",
      last_checked: new Date(Date.now() - WEEK).toISOString(),
    };

    await Deno.writeTextFile(
      join(tmpDirName, "latest.json"),
      JSON.stringify(checkFile, null, 2),
    );

    const out = await new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "./tests/fixture_update_check/mod.ts"],
      env: {
        CI: "false",
        TEST_HOME: tmpDirName,
        LATEST_VERSION: versions[0],
      },
      stderr: "piped",
      stdout: "piped",
    }).output();

    const { stdout } = getStdOutput(out);
    assertNotMatch(stdout, /Fresh .* is available/);

    await Deno.remove(tmpDirName, { recursive: true });
  },
});

Deno.test({
  name: "only shows update message when current < latest",
  async fn() {
    const tmpDirName = await Deno.makeTempDir();

    const checkFile: CheckFile = {
      current_version: "9999.999.0",
      latest_version: "1.2.0",
      last_checked: new Date().toISOString(),
    };

    await Deno.writeTextFile(
      join(tmpDirName, "latest.json"),
      JSON.stringify(checkFile, null, 2),
    );

    const out = await new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "./tests/fixture_update_check/mod.ts"],
      env: {
        CI: "false",
        TEST_HOME: tmpDirName,
        LATEST_VERSION: versions[0],
        CURRENT_VERSION: "99999.9999.0",
      },
      stderr: "piped",
      stdout: "piped",
    }).output();

    const { stdout } = getStdOutput(out);
    assertNotMatch(stdout, /Fresh .* is available/);

    await Deno.remove(tmpDirName, { recursive: true });
  },
});

Deno.test("migrates to last_shown property", async () => {
  const tmpDirName = await Deno.makeTempDir();

  const checkFile: CheckFile = {
    latest_version: "1.4.0",
    current_version: "1.2.0",
    last_checked: new Date().toISOString(),
  };

  await Deno.writeTextFile(
    join(tmpDirName, "latest.json"),
    JSON.stringify(checkFile, null, 2),
  );

  const out = await new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "./tests/fixture_update_check/mod.ts"],
    env: {
      CI: "false",
      TEST_HOME: tmpDirName,
      CURRENT_VERSION: "1.2.0",
      LATEST_VERSION: "99999.9999.0",
    },
    stderr: "piped",
    stdout: "piped",
  }).output();

  const { stdout } = getStdOutput(out);
  assertMatch(stdout, /Fresh .* is available/);

  const checkFileAfter = JSON.parse(
    await Deno.readTextFile(
      join(tmpDirName, "latest.json"),
    ),
  );

  assert(
    typeof checkFileAfter.last_shown === "string",
    "Did not write last_shown " + JSON.stringify(checkFileAfter, null, 2),
  );

  await Deno.remove(tmpDirName, { recursive: true });
});

Deno.test("doesn't show update if last_shown + interval >= today", async () => {
  const tmpDirName = await Deno.makeTempDir();

  const todayMinus1Hour = new Date();
  todayMinus1Hour.setHours(todayMinus1Hour.getHours() - 1);

  const checkFile: CheckFile = {
    current_version: "1.2.0",
    latest_version: "1.6.0",
    last_checked: new Date().toISOString(),
    last_shown: todayMinus1Hour.toISOString(),
  };

  await Deno.writeTextFile(
    join(tmpDirName, "latest.json"),
    JSON.stringify(checkFile, null, 2),
  );

  const out = await new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "./tests/fixture_update_check/mod.ts"],
    env: {
      CI: "false",
      TEST_HOME: tmpDirName,
      CURRENT_VERSION: "1.2.0",
      LATEST_VERSION: "99999.9999.0",
    },
    stderr: "piped",
    stdout: "piped",
  }).output();

  const { stdout } = getStdOutput(out);
  assertNotMatch(stdout, /Fresh .* is available/);

  await Deno.remove(tmpDirName, { recursive: true });
});

Deno.test(
  "shows update if last_shown + interval < today",
  async () => {
    const tmpDirName = await Deno.makeTempDir();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const checkFile: CheckFile = {
      current_version: "1.2.0",
      latest_version: "1.8.0",
      last_checked: new Date().toISOString(),
      last_shown: yesterday.toISOString(),
    };

    await Deno.writeTextFile(
      join(tmpDirName, "latest.json"),
      JSON.stringify(checkFile, null, 2),
    );

    const out = await new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "./tests/fixture_update_check/mod.ts"],
      env: {
        CI: "false",
        TEST_HOME: tmpDirName,
        CURRENT_VERSION: versions[0],
        LATEST_VERSION: "99999.9999.0",
      },
      stderr: "piped",
      stdout: "piped",
    }).output();

    const { stdout } = getStdOutput(out);
    assertMatch(stdout, /Fresh .* is available/);

    const checkFileAfter = JSON.parse(
      await Deno.readTextFile(
        join(tmpDirName, "latest.json"),
      ),
    );

    assertNotEquals(checkFileAfter.last_shown, yesterday.toISOString());

    await Deno.remove(tmpDirName, { recursive: true });
  },
);
