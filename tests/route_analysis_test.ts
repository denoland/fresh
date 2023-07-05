import { assertStringIncludes } from "./deps.ts";

Deno.test({
  name: "route-conflicts",
  async fn() {
    const cliProcess = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "-A",
        `tests/fixture_route_analysis/dev.ts`,
      ],
      stdin: "null",
      stdout: "piped",
      stderr: "piped",
    });

    const { stderr } = await cliProcess.output();
    const stderrDecoded = new TextDecoder().decode(stderr);
    assertStringIncludes(
      stderrDecoded,
      "Error: Route conflict detected. Multiple files have the same name",
    );
  },
});
