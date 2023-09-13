import { assertEquals } from "$std/testing/asserts.ts";
import {
  assertTextMany,
  fetchHtml,
  parseHtml,
  waitForText,
  withFresh,
  withPageName,
} from "./test_utils.ts";

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

Deno.test("can co-locate islands inside routes folder", async () => {
  await withPageName(
    "./tests/fixture/main.ts",
    async (page, address) => {
      await page.goto(`${address}/route-groups-islands/`);
      await page.waitForSelector("button");
      await page.click("button");
      await waitForText(page, "p", "1");
    },
  );
});

Deno.test("does not treat files in (_islands) as routes", async () => {
  await withFresh(
    "./tests/fixture/main.ts",
    async (address) => {
      const res = await fetch(`${address}/route-groups-islands/invalid`);
      assertEquals(res.status, 404);
      res.body?.cancel();
    },
  );
});

Deno.test("does not treat files in (_...) as routes", async () => {
  await withFresh(
    "./tests/fixture/main.ts",
    async (address) => {
      const res = await fetch(`${address}/route-groups-islands/sub`);
      assertEquals(res.status, 404);
      res.body?.cancel();
    },
  );
});

Deno.test("resolve index route in group /(group)/index.tsx", async () => {
  await withFresh(
    "./tests/fixture_group_index/main.ts",
    async (address) => {
      const res = await fetch(`${address}`);
      assertEquals(res.status, 200);
      const doc = parseHtml(await res.text());
      assertEquals(doc.querySelector("h1")?.textContent, "it works");
    },
  );
});
