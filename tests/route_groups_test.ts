import { assertEquals } from "$std/testing/asserts.ts";
import { withPageName } from "./test_utils.ts";

Deno.test("applies only _layout file of one group", async () => {
  await withPageName(
    "./tests/fixture/main.ts",
    async (page, address) => {
      await page.goto(`${address}/route-groups`);
      await page.waitForSelector("p");

      const texts = await page.$$eval(
        "p",
        (els) => Array.from(els).map((el) => el.textContent),
      );

      assertEquals(texts, ["Foo layout", "Foo page"]);
    },
  );
});

Deno.test("applies only _layout files in parent groups", async () => {
  await withPageName(
    "./tests/fixture/main.ts",
    async (page, address) => {
      await page.goto(`${address}/route-groups/baz`);
      await page.waitForSelector("p");

      const texts = await page.$$eval(
        "p",
        (els) => Array.from(els).map((el) => el.textContent),
      );

      assertEquals(texts, ["Bar layout", "Baz layout", "Baz page"]);
    },
  );
});

Deno.test("applies only _layout files in parent groups #2", async () => {
  await withPageName(
    "./tests/fixture/main.ts",
    async (page, address) => {
      await page.goto(`${address}/route-groups/boof`);
      await page.waitForSelector("p");

      const texts = await page.$$eval(
        "p",
        (els) => Array.from(els).map((el) => el.textContent),
      );

      assertEquals(texts, ["Bar layout", "Boof Page"]);
    },
  );
});
