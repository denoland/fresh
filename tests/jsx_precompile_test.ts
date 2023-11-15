import {
  assertSelector,
  assertTextMany,
  withFakeServe,
} from "$fresh/tests/test_utils.ts";
import { assertStringIncludes } from "$std/assert/mod.ts";

Deno.test("jsx precompile - rendering", async () => {
  await withFakeServe(
    "./tests/fixture_jsx_precompile/main.ts",
    async (server) => {
      const doc = await server.getHtml("/");
      assertTextMany(doc, "h1", ["Hello World"]);
      assertTextMany(doc, ".island", ["it works"]);
    },
  );
});

Deno.test("jsx precompile - <Head />", async () => {
  await withFakeServe(
    "./tests/fixture_jsx_precompile/main.ts",
    async (server) => {
      const doc = await server.getHtml("/head");
      assertTextMany(doc, "h1", ["Hello World"]);
      assertTextMany(doc, "head title", ["foo"]);
    },
  );
});

Deno.test("jsx precompile - static active links", async () => {
  await withFakeServe(
    "./tests/fixture_jsx_precompile/main.ts",
    async (server) => {
      const doc = await server.getHtml("/sub/foo");
      assertSelector(
        doc,
        `a[href="/sub"][data-ancestor="true"][aria-current="true"]`,
      );
      assertSelector(
        doc,
        `a[href="/sub/foo"][data-current="true"][aria-current="page"]`,
      );
    },
  );
});

Deno.test("jsx precompile - dynamic active links", async () => {
  await withFakeServe(
    "./tests/fixture_jsx_precompile/main.ts",
    async (server) => {
      const doc = await server.getHtml("/sub-dynamic/foo");
      assertSelector(
        doc,
        `a[href="/sub"][data-ancestor="true"][aria-current="true"]`,
      );
      assertSelector(
        doc,
        `a[href="/sub/foo"][data-current="true"][aria-current="page"]`,
      );
    },
  );
});

Deno.test("jsx precompile - twind", async () => {
  Deno.env.set("FRESH_FIXTURE_TWIND", "0.x");
  try {
    await withFakeServe(
      "./tests/fixture_jsx_precompile/main.ts",
      async (server) => {
        const doc = await server.getHtml("/twind");
        const style = doc.querySelector("#__FRSH_TWIND")?.textContent ?? "";
        assertStringIncludes(style, ".text-green-600");
      },
      { loadConfig: true },
    );
  } finally {
    Deno.env.delete("FRESH_FIXTURE_TWIND");
  }
});

Deno.test("jsx precompile - twind v1", async () => {
  Deno.env.set("FRESH_FIXTURE_TWIND", "1.x");
  try {
    await withFakeServe(
      "./tests/fixture_jsx_precompile/main.ts",
      async (server) => {
        const doc = await server.getHtml("/twind");
        const style = doc.querySelector("#__FRSH_TWIND")?.textContent ?? "";
        assertStringIncludes(style, ".text-green-600");
      },
      { loadConfig: true },
    );
  } finally {
    Deno.env.delete("FRESH_FIXTURE_TWIND");
  }
});
