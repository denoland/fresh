import { assertEquals } from "$std/testing/asserts.ts";
import {
  assertTextMany,
  parseHtml,
  waitForText,
  withFakeServe,
  withPageName,
} from "./test_utils.ts";

Deno.test("applies only _layout file of one group", async () => {
  await withFakeServe(
    "./tests/fixture/main.ts",
    async (server) => {
      const doc = await server.getHtml(`/route-groups`);

      assertTextMany(doc, "p", ["Foo layout", "Foo page"]);
    },
  );
});

Deno.test("applies only _layout files in parent groups", async () => {
  await withFakeServe(
    "./tests/fixture/main.ts",
    async (server) => {
      const doc = await server.getHtml(`/route-groups/baz`);
      assertTextMany(doc, "p", ["Bar layout", "Baz layout", "Baz page"]);
    },
  );
});

Deno.test("applies only _layout files in parent groups #2", async () => {
  await withFakeServe(
    "./tests/fixture/main.ts",
    async (server) => {
      const doc = await server.getHtml(`/route-groups/boof`);
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
  await withFakeServe(
    "./tests/fixture/main.ts",
    async (server) => {
      const res = await server.get(`/route-groups-islands/invalid`);
      assertEquals(res.status, 404);
      await res.body?.cancel();
    },
  );
});

Deno.test("does not treat files in (_...) as routes", async () => {
  await withFakeServe(
    "./tests/fixture/main.ts",
    async (server) => {
      const res = await server.get(`/route-groups-islands/sub`);
      assertEquals(res.status, 404);
      await res.body?.cancel();
    },
  );
});

Deno.test("resolve index route in group /(group)/index.tsx", async () => {
  await withFakeServe(
    "./tests/fixture_group_index/main.ts",
    async (server) => {
      const res = await server.get(`/`);
      assertEquals(res.status, 200);
      const doc = parseHtml(await res.text());
      assertEquals(doc.querySelector("h1")?.textContent, "it works");
    },
  );
});
