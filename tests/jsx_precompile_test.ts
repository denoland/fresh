import {
  assertSelector,
  assertTextMany,
  fetchHtml,
  withFresh,
} from "$fresh/tests/test_utils.ts";
import { assert, assertEquals, assertStringIncludes } from "$std/assert/mod.ts";

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

Deno.test("jsx precompile - asset urls src", async () => {
  await withFresh(
    "./tests/fixture_jsx_precompile/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}/asset`);

      const imgs = Array.from(doc.querySelectorAll("img"));
      for (let i = 0; i < imgs.length; i++) {
        const img = imgs[i];
        const url = new URL(img.src, "http://localhost");
        assert(
          url.searchParams.has("__frsh_c"),
          `Missing __frsh_c param in ${img.src}`,
        );
      }
    },
  );
});

Deno.test("jsx precompile - asset urls srcset", async () => {
  await withFresh(
    "./tests/fixture_jsx_precompile/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}/asset_srcset`);

      const imgs = Array.from(doc.querySelectorAll("img"));
      for (let i = 0; i < imgs.length; i++) {
        const parts = imgs[i].srcset.split(/,/g);

        for (let j = 0; j < parts.length; j++) {
          assertStringIncludes(parts[j], "__frsh_c");
        }
      }
    },
  );
});

Deno.test("jsx precompile - f-client-nav", async () => {
  await withFresh(
    "./tests/fixture_jsx_precompile/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}/fresh_attrs`);
      const value = doc.querySelector("[f-client-nav]")?.getAttribute(
        "f-client-nav",
      );
      assertEquals(value, "true");
    },
  );
});
