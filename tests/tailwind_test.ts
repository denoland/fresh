import { runBuild, withFakeServe } from "$fresh/tests/test_utils.ts";
import { assertStringIncludes } from "$std/assert/mod.ts";

Deno.test("TailwindCSS - dev mode", async () => {
  await withFakeServe("./tests/fixture_tailwind/dev.ts", async (server) => {
    const res = await server.get("/styles.css");
    const content = await res.text();
    assertStringIncludes(content, ".text-red-600");
  }, { loadConfig: true });
});

Deno.test("TailwindCSS - build mode", async () => {
  await runBuild("./tests/fixture_tailwind/dev.ts");
  await withFakeServe("./tests/fixture_tailwind/main.ts", async (server) => {
    const res = await server.get("/styles.css");
    const content = await res.text();
    assertStringIncludes(content, ".text-red-600");
  }, { loadConfig: true });
});

Deno.test("TailwindCSS - config", async () => {
  await withFakeServe(
    "./tests/fixture_tailwind_config/dev.ts",
    async (server) => {
      const res = await server.get("/styles.css");
      const content = await res.text();
      assertStringIncludes(content, ".text-pp");
    },
    { loadConfig: true },
  );
});
