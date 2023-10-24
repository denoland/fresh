import { assert } from "./deps.ts";
import {
  assertNotSelector,
  assertSelector,
  clickWhenListenerReady,
  waitForText,
  withFakeServe,
  withPageName,
} from "./test_utils.ts";

Deno.test("apply root _layout and _app", async () => {
  await withFakeServe(
    "./tests/fixture_layouts/main.ts",
    async (server) => {
      const doc = await server.getHtml("/");
      assert(doc.body.textContent?.includes("it works"));
      assertSelector(doc, ".app .root-layout .home-page");

      const doc2 = await server.getHtml("/other");
      assertSelector(doc2, ".app .root-layout .other-page");
    },
  );
});

Deno.test("apply sub layouts", async () => {
  await withFakeServe(
    "./tests/fixture_layouts/main.ts",
    async (server) => {
      const doc = await server.getHtml("/foo");
      assertSelector(doc, ".app .root-layout .foo-layout .foo-page");

      const doc2 = await server.getHtml("/foo/bar");
      assertSelector(doc2, ".app .root-layout .foo-layout .bar-page");
    },
  );
});

Deno.test("skip layouts if not present", async () => {
  await withFakeServe(
    "./tests/fixture_layouts/main.ts",
    async (server) => {
      const doc = await server.getHtml(`/skip/sub`);
      assertSelector(doc, ".app .root-layout .sub-layout .sub-page");
    },
  );
});

Deno.test("check file types", async (t) => {
  await withFakeServe(
    "./tests/fixture_layouts/main.ts",
    async (server) => {
      await t.step(".js", async () => {
        const doc = await server.getHtml(`/files/js`);
        assertSelector(doc, ".app .root-layout .js-layout .js-page");
      });

      await t.step(".jsx", async () => {
        const doc = await server.getHtml(`/files/jsx`);
        assertSelector(doc, ".app .root-layout .jsx-layout .jsx-page");
      });

      await t.step(".ts", async () => {
        const doc = await server.getHtml(`/files/ts`);
        assertSelector(doc, ".app .root-layout .ts-layout .ts-page");
      });

      await t.step(".tsx", async () => {
        const doc = await server.getHtml(`/files/tsx`);
        assertSelector(doc, ".app .root-layout .tsx-layout .tsx-page");
      });
    },
  );
});

Deno.test("render async layout", async () => {
  await withFakeServe(
    "./tests/fixture_layouts/main.ts",
    async (server) => {
      const doc = await server.getHtml(`/async`);
      assertSelector(doc, ".app .root-layout .async-layout .async-page");
    },
  );
});

Deno.test("render nested async layout", async () => {
  await withFakeServe(
    "./tests/fixture_layouts/main.ts",
    async (server) => {
      const doc = await server.getHtml(`/async/sub`);
      assertSelector(
        doc,
        ".app .root-layout .async-layout .async-sub-layout .async-sub-page",
      );
    },
  );
});

Deno.test("can return Response from async layout", async () => {
  await withFakeServe(
    "./tests/fixture_layouts/main.ts",
    async (server) => {
      const doc = await server.getHtml(`/async/redirect`);
      assertSelector(
        doc,
        ".app .root-layout .async-layout .async-sub-layout .async-sub-page",
      );
    },
  );
});

Deno.test("disable _app layout", async () => {
  await withFakeServe(
    "./tests/fixture_layouts/main.ts",
    async (server) => {
      const doc = await server.getHtml(`/override/no_app`);
      assertNotSelector(doc, "body body");
      assertSelector(doc, "body > .override-layout >.no-app");
    },
  );
});

Deno.test("disable _app in _layout", async () => {
  await withFakeServe(
    "./tests/fixture_layouts/main.ts",
    async (server) => {
      const doc = await server.getHtml(`/override/layout_no_app`);
      assertNotSelector(doc, "body body");
      assertSelector(doc, "body > .override-layout > .no-app-layout > .page");
    },
  );
});

Deno.test("override layouts", async () => {
  await withFakeServe(
    "./tests/fixture_layouts/main.ts",
    async (server) => {
      const doc = await server.getHtml(`/override`);
      assertSelector(doc, "body > .app > .override-layout > .override-page");
    },
  );
});

Deno.test("route overrides layout", async () => {
  await withFakeServe(
    "./tests/fixture_layouts/main.ts",
    async (server) => {
      const doc = await server.getHtml(`/override/no_layout`);
      assertSelector(doc, "body > .app > .no-layouts");
    },
  );
});

Deno.test("route overrides layout and app", async () => {
  await withFakeServe(
    "./tests/fixture_layouts/main.ts",
    async (server) => {
      const doc = await server.getHtml(`/override/no_layout_no_app`);
      assertSelector(doc, "body > .no-app-no-layouts");
    },
  );
});

Deno.test({
  name: "island in dynamic route test",
  async fn(t) {
    await withPageName(
      "./tests/fixture_layouts/main.ts",
      async (page, address) => {
        async function counterTest(counterId: string, originalValue: number) {
          const pElem = await page.waitForSelector(`#${counterId} > p`);

          const value = await pElem?.evaluate((el) => el.textContent);
          assert(value === `${originalValue}`, `${counterId} first value`);

          await clickWhenListenerReady(page, `#b-${counterId}`);
          await waitForText(
            page,
            `#${counterId} > p`,
            String(originalValue + 1),
          );
        }

        await page.goto(`${address}/dynamic/acme-corp`, {
          waitUntil: "networkidle2",
        });

        await t.step("Ensure 1 island on 1 page are revived", async () => {
          await counterTest("counter", 3);
        });
      },
    );
  },
});

Deno.test("mix async app and layouts", async () => {
  await withFakeServe(
    "./tests/fixture_layouts_2/main.ts",
    async (server) => {
      const doc = await server.getHtml(`/`);
      assertSelector(doc, ".app > .root-layout > .home-page");
    },
  );
});
