import {
  assertSelector,
  fetchHtml,
  withFresh,
} from "$fresh/tests/test_utils.ts";
import { assertEquals } from "$std/testing/asserts.ts";

Deno.test("doesn't leak data across renderers", async () => {
  // Issue: https://github.com/denoland/fresh/issues/1636
  await withFresh("./tests/fixture/main.ts", async (address) => {
    function load(name: string) {
      return fetchHtml(`${address}/admin/${name}`).then((doc) => {
        assertSelector(doc, "#__FRSH_STATE");
        const text = doc.querySelector("#__FRSH_STATE")?.textContent!;
        const json = JSON.parse(text);
        assertEquals(json, { "v": [[{ "site": name }], []] });
      });
    }

    const promises: Promise<void>[] = [];
    for (let i = 0; i < 100; i++) {
      promises.push(load("foo"));
      promises.push(load("bar"));
    }

    await Promise.all(promises);
  });
});
