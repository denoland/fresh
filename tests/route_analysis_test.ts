import { startFreshServerExpectErrors } from "./test_utils.ts";
import { dirname, join } from "$std/path/mod.ts";
import { assertStringIncludes } from "./deps.ts";

const dir = dirname(import.meta.url);

Deno.test({
  name: "route-conflicts",
  async fn() {
    const errorMessage = await startFreshServerExpectErrors({
      args: ["run", "-A", join(dir, "./fixture_route_analysis/dev.ts")],
    });
    assertStringIncludes(
      errorMessage,
      "Error: Route conflict detected. Multiple files have the same name",
    );
  },
});
