import { colors, join } from "../src/server/deps.ts";
import {
  assertEquals,
  assertMatch,
  assertNotMatch,
} from "$std/testing/asserts.ts";
import versions from "../versions.json" assert { type: "json" };

Deno.test({
  name: "stores update check file in $HOME/fresh",
  async fn() {
    const tmpDirName = await Deno.makeTempDir();
    const filePath = join(tmpDirName, "latest.json");

    await new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "./tests/fixture_update_check/mod.ts"],
      env: {
        HOME: tmpDirName,
      },
    }).output();

    const text = JSON.parse(await Deno.readTextFile(filePath));
    assertEquals(text, {
      current_version: versions[0],
      latest_version: "99.99.999",
      last_checked: text.last_checked,
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
            HOME: tmpDirName,
            LATEST_VERSION: "1.30.0",
          },
        }).output();

        const decoder = new TextDecoder();
        const stdout = colors.stripColor(decoder.decode(out.stdout));
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
        HOME: tmpDirName,
        LATEST_VERSION: "1.30.0",
      },
    }).output();

    const decoder = new TextDecoder();

    const stdout = colors.stripColor(decoder.decode(out.stdout));
    assertMatch(stdout, /Fresh 1\.30\.0 is available/);

    // Updates check file
    const text = JSON.parse(await Deno.readTextFile(filePath));
    assertEquals(text, {
      current_version: "1.1.0",
      latest_version: "1.30.0",
      last_checked: text.last_checked,
    });

    await Deno.remove(tmpDirName, { recursive: true });
  },
  sanitizeResources: false,
});

Deno.test({
  name: "only fetch new version defined by interval",
  async fn(t) {
    const tmpDirName = await Deno.makeTempDir();
    const decoder = new TextDecoder();

    await t.step("fetches latest version initially", async () => {
      const out = await new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", "./tests/fixture_update_check/mod.ts"],
        env: {
          CI: "false",
          UPDATE_INTERVAL: "100000",
          HOME: tmpDirName,
          LATEST_VERSION: "1.30.0",
        },
      }).output();

      const stdout = colors.stripColor(decoder.decode(out.stdout));
      assertMatch(stdout, /fetching latest version/);
    });

    await t.step("should not fetch if interval has not passed", async () => {
      const out = await new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", "./tests/fixture_update_check/mod.ts"],
        env: {
          CI: "false",
          UPDATE_INTERVAL: "100000",
          HOME: tmpDirName,
          LATEST_VERSION: "1.30.0",
        },
      }).output();

      const stdout = colors.stripColor(decoder.decode(out.stdout));
      assertNotMatch(stdout, /fetching latest version/);
    });

    await t.step("fetches if interval has passed", async () => {
      const out = await new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", "./tests/fixture_update_check/mod.ts"],
        env: {
          CI: "false",
          UPDATE_INTERVAL: "1 ",
          HOME: tmpDirName,
          LATEST_VERSION: "1.30.0",
        },
      }).output();

      const stdout = colors.stripColor(decoder.decode(out.stdout));
      assertMatch(stdout, /fetching latest version/);
    });

    await Deno.remove(tmpDirName, { recursive: true });
  },
});
