import { withPageName } from "./test_utils.ts";

Deno.test("apply root _layout and _app", async () => {
  await withPageName(
    "./tests/fixture_layouts/main.ts",
    async (page, address) => {
      await page.goto(address);
      await page.waitForSelector(".app .root-layout .home-page");

      await page.goto(`${address}/other`);
      await page.waitForSelector(".app .root-layout .other-page");
    },
  );
});

Deno.test("apply sub layouts", async () => {
  await withPageName(
    "./tests/fixture_layouts/main.ts",
    async (page, address) => {
      await page.goto(`${address}/foo`);
      await page.waitForSelector(".app .root-layout .foo-layout .foo-page");

      await page.goto(`${address}/foo/bar`);
      await page.waitForSelector(".app .root-layout .foo-layout .bar-page");
    },
  );
});

Deno.test("skip layouts if not present", async () => {
  await withPageName(
    "./tests/fixture_layouts/main.ts",
    async (page, address) => {
      await page.goto(`${address}/skip/sub`);
      await page.waitForSelector(".app .root-layout .sub-layout .sub-page");
    },
  );
});

Deno.test("check file types", async (t) => {
  await withPageName(
    "./tests/fixture_layouts/main.ts",
    async (page, address) => {
      await t.step(".js", async () => {
        await page.goto(`${address}/files/js`);
        await page.waitForSelector(".app .root-layout .js-layout .js-page");
      });

      await t.step(".jsx", async () => {
        await page.goto(`${address}/files/jsx`);
        await page.waitForSelector(".app .root-layout .jsx-layout .jsx-page");
      });

      await t.step(".ts", async () => {
        await page.goto(`${address}/files/ts`);
        await page.waitForSelector(".app .root-layout .ts-layout .ts-page");
      });

      await t.step(".tsx", async () => {
        await page.goto(`${address}/files/tsx`);
        await page.waitForSelector(".app .root-layout .tsx-layout .tsx-page");
      });
    },
  );
});
