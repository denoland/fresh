import {
  assertSelector,
  assertTextMany,
  fetchHtml,
  withFresh,
} from "$fresh/tests/test_utils.ts";
import { assertStringIncludes } from "$std/assert/mod.ts";

Deno.test("jsx precompile - rendering", async () => {
  await withFresh(
    "./tests/fixture_jsx_precompile/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}`);
      assertTextMany(doc, "h1", ["Hello World"]);
      assertTextMany(doc, ".island", ["it works"]);
    },
  );
});

Deno.test("jsx precompile - <Head />", async () => {
  await withFresh(
    "./tests/fixture_jsx_precompile/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}/head`);
      assertTextMany(doc, "h1", ["Hello World"]);
      assertTextMany(doc, "head title", ["foo"]);
    },
  );
});

Deno.test("jsx precompile - static active links", async () => {
  await withFresh(
    "./tests/fixture_jsx_precompile/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}/sub/foo`);
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
  await withFresh(
    "./tests/fixture_jsx_precompile/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}/sub-dynamic/foo`);
      assertSelector(
        doc,
        `a[href="/sub-dynamic"][data-ancestor="true"][aria-current="true"]`,
      );
      assertSelector(
        doc,
        `a[href="/sub-dynamic/foo"][data-current="true"][aria-current="page"]`,
      );
    },
  );
});

Deno.test("jsx precompile - twind", async () => {
  await withFresh(
    {
      name: "./tests/fixture_jsx_precompile/main.ts",
      options: {
        env: {
          "FRESH_FIXTURE_TWIND": "0.x",
        },
      },
    },
    async (address) => {
      const doc = await fetchHtml(`${address}/twind`);
      const style = doc.querySelector("#__FRSH_TWIND")?.textContent ?? "";
      assertStringIncludes(style, ".text-green-600");
    },
  );
});

Deno.test("jsx precompile - twind v1", async () => {
  await withFresh(
    {
      name: "./tests/fixture_jsx_precompile/main.ts",
      options: {
        env: {
          "FRESH_FIXTURE_TWIND": "1.x",
        },
      },
    },
    async (address) => {
      const doc = await fetchHtml(`${address}/twind`);
      const style = doc.querySelector("#__FRSH_TWIND")?.textContent ?? "";
      assertStringIncludes(style, ".text-green-600");
    },
  );
});
