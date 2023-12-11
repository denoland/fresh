import { runBuild, withFakeServe } from "./test_utils.ts";
import { assert, assertStringIncludes } from "./deps.ts";

Deno.test("TailwindCSS - dev mode", async () => {
  await withFakeServe("./tests/fixture_tailwind/dev.ts", async (server) => {
    const res = await server.get("/styles.css");
    const content = await res.text();
    assertStringIncludes(content, ".text-red-600");

    const res2 = await server.get("/styles.css?foo=bar");
    const content2 = await res2.text();
    assert(!content2.includes("@tailwind"));
  }, { loadConfig: true });
});

Deno.test("TailwindCSS - build mode", async () => {
  await runBuild("./tests/fixture_tailwind_build/dev.ts");
  await withFakeServe(
    "./tests/fixture_tailwind_build/main.ts",
    async (server) => {
      const res = await server.get("/styles.css");
      const content = await res.text();
      assertStringIncludes(content, ".text-red-600{");
    },
    { loadConfig: true },
  );
});

Deno.test("TailwindCSS - build mode in sub directory", async () => {
  await runBuild("./tests/fixture_tailwind_build_2/dev.ts");
  await withFakeServe(
    "./tests/fixture_tailwind_build_2/main.ts",
    async (server) => {
      const res = await server.get("/foo/styles.css");
      const content = await res.text();
      assertStringIncludes(content, ".text-red-600{");
    },
    { loadConfig: true },
  );
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

Deno.test("TailwindCSS - middleware only css", async () => {
  await withFakeServe(
    "./tests/fixture_tailwind/dev.ts",
    async (server) => {
      const res = await server.get("/middleware-only.css");
      const content = await res.text();
      assertStringIncludes(content, ".foo-bar");
    },
    { loadConfig: true },
  );
});
