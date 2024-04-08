import { fetchHtml, runBuild, withFakeServe, withFresh } from "./test_utils.ts";
import {
  assert,
  assertStringIncludes,
  dirname,
  join,
  TextLineStream,
} from "./deps.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";

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

Deno.test("TailwindCSS - missing snapshot warning", async () => {
  const dir = dirname(import.meta.url);
  const out = await new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", join(dir, "./fixture_tailwind/main.ts")],
    stdout: "piped",
    stderr: "piped",
  }).spawn();

  const lines: ReadableStream<string> = out.stderr
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());

  let found = false;
  // @ts-ignore yes it does
  for await (const line of lines.values({ preventCancel: true })) {
    if (!found && line.includes("No pre-compiled tailwind styles found")) {
      found = true;
      break;
    }
  }

  try {
    assert(found, "Tailwind compile warning was not logged");
  } finally {
    await out.stdout.cancel();
    out.kill("SIGTERM");
    await out.status;

    // Drain the lines stream
    for await (const _ of lines) { /* noop */ }
  }
});

Deno.test("TailwindCSS - missing snapshot on Deno Deploy", async () => {
  await withFresh(
    {
      name: "./tests/fixture_tailwind/main.ts",
      options: {
        env: {
          DENO_DEPLOYMENT_ID: "foo",
        },
      },
    },
    async (address) => {
      const doc = await fetchHtml(address);
      assertEquals(
        doc.querySelector("h1")?.textContent,
        "Finish setting up Fresh",
      );
    },
  );
});
