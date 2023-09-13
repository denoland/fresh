import * as path from "$std/path/mod.ts";
import { startFreshServer } from "$fresh/tests/test_utils.ts";
import { assertEquals } from "$std/testing/asserts.ts";

Deno.test({
  name: "dev_command config",
  async fn() {
    const fixture = path.join(Deno.cwd(), "tests", "fixture_dev_command");
    const { serverProcess, lines, address } = await startFreshServer({
      args: [
        "run",
        "-A",
        path.join(fixture, "dev_config.ts"),
      ],
    });
    const res = await fetch(`${address}/`);
    const text = await res.text();
    assertEquals(text, "config");
    await lines.cancel();
    serverProcess.kill("SIGTERM");
    await serverProcess.status;
  },
});

Deno.test({
  name: "dev_command legacy",
  async fn() {
    const fixture = path.join(Deno.cwd(), "tests", "fixture_dev_command");
    const { serverProcess, lines, address } = await startFreshServer({
      args: [
        "run",
        "-A",
        path.join(fixture, "dev_legacy.ts"),
      ],
    });
    const res = await fetch(`${address}/`);
    const text = await res.text();
    assertEquals(text, "legacy");
    await lines.cancel();
    serverProcess.kill("SIGTERM");
    await serverProcess.status;
  },
});
