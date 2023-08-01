import { assertTextMany, fetchHtml, withFresh } from "./test_utils.ts";

Deno.test("applies only _layout file of one group", async () => {
  await withFresh(
    "./tests/fixture/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}/route-groups`);

      assertTextMany(doc, "p", ["Foo layout", "Foo page"]);
    },
  );
});

Deno.test("applies only _layout files in parent groups", async () => {
  await withFresh(
    "./tests/fixture/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}/route-groups/baz`);
      assertTextMany(doc, "p", ["Bar layout", "Baz layout", "Baz page"]);
    },
  );
});

Deno.test("applies only _layout files in parent groups #2", async () => {
  await withFresh(
    "./tests/fixture/main.ts",
    async (address) => {
      const doc = await fetchHtml(`${address}/route-groups/boof`);
      assertTextMany(doc, "p", ["Bar layout", "Boof Page"]);
    },
  );
});
