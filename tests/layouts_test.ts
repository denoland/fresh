import { assert } from "./deps.ts";
import {
  assertNotSelector,
  assertSelector,
  fetchHtml,
  withFresh,
} from "./test_utils.ts";

Deno.test("apply root _layout and _app", async () => {
  await withFresh(
    "./tests/fixture_layouts/main.ts",
    async (address) => {
      const doc = await fetchHtml(address);
      assert(doc.body.textContent?.includes("it works"));
      assertSelector(doc, ".app .root-layout .home-page");

      const doc2 = await fetchHtml(`${address}/other`);
      assertSelector(doc2, ".app .root-layout .other-page");
    },
  );
});

Deno.test("apply sub layouts", async () => {
  await withFresh(
    "./tests/fixture_layouts/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}/foo`);
      assertSelector(doc, ".app .root-layout .foo-layout .foo-page");

      const doc2 = await fetchHtml(`${address}/foo/bar`);
      assertSelector(doc2, ".app .root-layout .foo-layout .bar-page");
    },
  );
});

Deno.test("skip layouts if not present", async () => {
  await withFresh(
    "./tests/fixture_layouts/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}/skip/sub`);
      assertSelector(doc, ".app .root-layout .sub-layout .sub-page");
    },
  );
});

Deno.test("check file types", async (t) => {
  await withFresh(
    "./tests/fixture_layouts/main.ts",
    async (address) => {
      await t.step(".js", async () => {
        const doc = await fetchHtml(`${address}/files/js`);
        assertSelector(doc, ".app .root-layout .js-layout .js-page");
      });

      await t.step(".jsx", async () => {
        const doc = await fetchHtml(`${address}/files/jsx`);
        assertSelector(doc, ".app .root-layout .jsx-layout .jsx-page");
      });

      await t.step(".ts", async () => {
        const doc = await fetchHtml(`${address}/files/ts`);
        assertSelector(doc, ".app .root-layout .ts-layout .ts-page");
      });

      await t.step(".tsx", async () => {
        const doc = await fetchHtml(`${address}/files/tsx`);
        assertSelector(doc, ".app .root-layout .tsx-layout .tsx-page");
      });
    },
  );
});

Deno.test("render async layout", async () => {
  await withFresh(
    "./tests/fixture_layouts/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}/async`);
      assertSelector(doc, ".app .root-layout .async-layout .async-page");
    },
  );
});

Deno.test("render nested async layout", async () => {
  await withFresh(
    "./tests/fixture_layouts/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}/async/sub`);
      assertSelector(
        doc,
        ".app .root-layout .async-layout .async-sub-layout .async-sub-page",
      );
    },
  );
});

Deno.test({
  name: "can return Response from async layout",
  fn: async () => {
    await withFresh(
      "./tests/fixture_layouts/main.ts",
      async (address) => {
        const doc = await fetchHtml(`${address}/async/redirect`);
        assertSelector(
          doc,
          ".app .root-layout .async-layout .async-sub-layout .async-sub-page",
        );
      },
    );
  },
});

Deno.test("disable _app layout", async () => {
  await withFresh(
    "./tests/fixture_layouts/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}/override/no_app`);
      assertNotSelector(doc, "body body");
      assertSelector(doc, "body > .override-layout >.no-app");
    },
  );
});

Deno.test("disable _app in _layout", async () => {
  await withFresh(
    "./tests/fixture_layouts/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}/override/layout_no_app`);
      assertNotSelector(doc, "body body");
      assertSelector(doc, "body > .override-layout > .no-app-layout > .page");
    },
  );
});

Deno.test("override layouts", async () => {
  await withFresh(
    "./tests/fixture_layouts/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}/override`);
      assertSelector(doc, "body > .app > .override-layout > .override-page");
    },
  );
});

Deno.test("route overrides layout", async () => {
  await withFresh(
    "./tests/fixture_layouts/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}/override/no_layout`);
      assertSelector(doc, "body > .app > .no-layouts");
    },
  );
});

Deno.test("route overrides layout and app", async () => {
  await withFresh(
    "./tests/fixture_layouts/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}/override/no_layout_no_app`);
      assertSelector(doc, "body > .no-app-no-layouts");
    },
  );
});
