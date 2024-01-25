import { assert, assertEquals, assertMatch, Page } from "./deps.ts";
import {
  assertMetaContent,
  assertNoComments,
  assertNoPageComments,
  assertNotSelector,
  assertSelector,
  assertTextMany,
  getErrorOverlay,
  parseHtml,
  waitFor,
  waitForText,
  withFakeServe,
  withPageName,
} from "./test_utils.ts";

async function assertLogs(page: Page, expected: string[]) {
  const text = expected.length > 0 ? expected.join("\n") + "\n" : "";
  await waitForText(page, "#logs", text);
}

Deno.test("injects server content with no islands present", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/no_islands`);
      await page.waitForSelector(".output");

      const href = await page.$eval(".update-link", (el) => el.href);
      await page.click(".update-link");
      await waitForText(page, "p", "it works");

      assertEquals(href, await page.url());
      await assertNoPageComments(page);
    },
  );
});

Deno.test(
  "throws when Partial is instantiated inside an island",
  async () => {
    await withFakeServe(
      "./tests/fixture_partials/main.ts",
      async (server) => {
        const res = await server.get("/partial_slot_inside_island");
        assertEquals(res.status, 500);
        await res.text(); // Consume
      },
    );

    await withFakeServe(
      "./tests/fixture_partials/dev.ts",
      async (server) => {
        const { title } = await getErrorOverlay(
          server,
          "/partial_slot_inside_island",
        );
        assertMatch(
          title,
          /<Partial> components cannot be used inside islands/,
        );
      },
    );
  },
);

Deno.test("warns on missing partial", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      const logs: string[] = [];
      page.on("console", (msg) => logs.push(msg.text()));

      const initialUrl = `${address}/missing_partial`;
      await page.goto(initialUrl);
      await page.waitForSelector(".status-initial");

      await page.click(".update-link");

      await waitFor(() =>
        logs.find((line) => /^Partial.*not found/.test(line))
      );
    },
  );
});

Deno.test("does not include revive() when no island present", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      const logs: string[] = [];
      page.on("pageerror", (msg) => logs.push(msg.message));

      const initialUrl = `${address}`;
      await page.goto(initialUrl, {
        waitUntil: "networkidle2",
      });

      // Should not error
      assertEquals(logs, []);
    },
  );
});

Deno.test("injects content with island and keeps island instance alive", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_instance`);
      await page.waitForSelector(".output-a");

      // Update island state
      await page.click(".island button");
      await waitForText(page, ".output-a", "1");
      await assertLogs(page, ["mount Counter A", "update Counter A"]);
      await assertNoPageComments(page);

      const href = await page.$eval(".update-link", (el) => el.href);
      await page.click(".update-link");
      await waitForText(page, ".status", "updated content");
      await assertLogs(page, ["mount Counter A", "update Counter A"]);

      assertEquals(href, await page.url());

      // Check that island value didn't change
      await waitForText(page, ".output-a", "1");
      await assertNoPageComments(page);
    },
  );
});

Deno.test("finds partial nested in response", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/deep_partial`);
      await page.waitForSelector(".status");

      await page.click(".update-link");
      await waitForText(page, ".status-updated", "updated");
    },
  );
});

Deno.test("unmounts island", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_instance`);
      await page.waitForSelector(".output-a");

      const href = await page.$eval(".remove-link", (el) => el.href);
      await page.click(".remove-link");
      await waitForText(page, ".status", "no islands");
      await assertNoPageComments(page);

      assertEquals(href, await page.url());
      await assertLogs(page, ["mount Counter A", "unmount Counter A"]);

      await page.click(".update-link");
      await waitForText(page, ".status", "updated content");
      await assertNoPageComments(page);

      await assertLogs(page, [
        "mount Counter A",
        "unmount Counter A",
        "mount Counter A",
      ]);
    },
  );
});

Deno.test("unmounts island on replace", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_instance`);
      await page.waitForSelector(".output-a");

      // Update island state
      await page.click(".island-a button");
      await waitForText(page, ".output-a", "1");
      await assertNoPageComments(page);

      const href = await page.$eval(".replace-link", (el) => el.href);
      await page.click(".replace-link");
      await waitForText(page, ".status-replaced", "replaced content");
      await assertNoPageComments(page);

      assertEquals(href, await page.url());
      await assertLogs(page, [
        "mount Counter A",
        "update Counter A",
        "unmount Counter A",
        "mount Other",
      ]);

      await page.click(".island-other button");
      await waitForText(page, ".output-other", "1");
      await assertNoPageComments(page);

      await assertLogs(page, [
        "mount Counter A",
        "update Counter A",
        "unmount Counter A",
        "mount Other",
        "update Other",
      ]);
    },
  );
});

Deno.test("updates only one partial of many", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_instance_multiple`);
      await page.waitForSelector(".output-a");

      // Update island state
      await page.click(".island-a button");
      await waitForText(page, ".output-a", "1");
      await assertNoPageComments(page);

      await page.click(".island-b button");
      await waitForText(page, ".output-b", "1");
      await assertNoPageComments(page);

      await assertLogs(page, [
        "mount Counter A",
        "mount Counter B",
        "update Counter A",
        "update Counter B",
      ]);

      const href = await page.$eval(".update-second-link", (el) => el.href);
      await page.click(".update-second-link");
      await page.waitForSelector(".status-2");
      await assertNoPageComments(page);

      assertEquals(href, await page.url());

      // Check that island value didn't change
      await waitForText(page, ".output-a", "1");
      await waitForText(page, ".output-b", "1");
    },
  );
});

Deno.test("updates many partials at once", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_instance_multiple`);
      await page.waitForSelector(".output-a");

      // Update island state
      await page.click(".island-a button");
      await waitForText(page, ".output-a", "1");
      await assertNoPageComments(page);

      await page.click(".island-b button");
      await waitForText(page, ".output-b", "1");
      await assertNoPageComments(page);

      await assertLogs(page, [
        "mount Counter A",
        "mount Counter B",
        "update Counter A",
        "update Counter B",
      ]);

      const href = await page.$eval(".update-both-link", (el) => el.href);
      await page.click(".update-both-link");
      await page.waitForSelector(".status-1");
      await page.waitForSelector(".status-2");
      await assertNoPageComments(page);

      assertEquals(href, await page.url());

      // Check that island value didn't change
      await waitForText(page, ".output-a", "1");
      await waitForText(page, ".output-b", "1");
    },
  );
});

Deno.test("keeps nested island state", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_instance_nested`);
      await page.waitForSelector(".output-a");

      // Update island state
      await page.click(".island-a button");
      await waitForText(page, ".output-a", "1");
      await assertNoPageComments(page);

      await page.click(".island-b button");
      await waitForText(page, ".output-b", "1");
      await assertNoPageComments(page);

      await assertLogs(page, [
        "mount Counter A",
        "mount Counter B",
        "mount PassThrough",
        "mount PassThrough",
        "update Counter A",
        "update Counter B",
      ]);

      const href = await page.$eval(".update-link", (el) => el.href);
      await page.click(".update-link");
      await page.waitForSelector(".status-a");
      await page.waitForSelector(".status-b");
      await assertNoPageComments(page);

      assertEquals(href, await page.url());

      // Check that island value didn't change
      await waitForText(page, ".output-a", "1");
      await waitForText(page, ".output-b", "1");
    },
  );
});

Deno.test("replace island if parent type changes", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_instance_nested`);
      await page.waitForSelector(".output-a");

      // Update island state
      await page.click(".island-a button");
      await waitForText(page, ".output-a", "1");
      await assertNoPageComments(page);

      await page.click(".island-b button");
      await waitForText(page, ".output-b", "1");
      await assertNoPageComments(page);

      await assertLogs(page, [
        "mount Counter A",
        "mount Counter B",
        "mount PassThrough",
        "mount PassThrough",
        "update Counter A",
        "update Counter B",
      ]);

      const href = await page.$eval(".replace-link", (el) => el.href);
      await page.click(".replace-link");
      await page.waitForSelector(".output-a");

      assertEquals(href, await page.url());

      // Check that island value was destroyed since we replaced it
      await waitForText(page, ".output-a", "0");

      await assertLogs(page, [
        "mount Counter A",
        "mount Counter B",
        "mount PassThrough",
        "mount PassThrough",
        "update Counter A",
        "update Counter B",
        "unmount PassThrough",
        "unmount Counter A",
        "unmount PassThrough",
        "unmount Counter B",
        "mount Counter A",
      ]);
    },
  );
});

Deno.test("serializes props", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_props`);
      await page.waitForSelector(".pre-props");

      let text = JSON.parse(
        await page.$eval(".pre-props", (el) => el.textContent!),
      );
      assertEquals(
        text,
        {
          number: 1,
          string: "foo",
          boolean: true,
          null: null,
          object: { foo: 123 },
          strArr: ["foo"],
        },
      );

      await page.click(".update-link");
      await page.waitForSelector(".status-updated");
      text = JSON.parse(
        await page.$eval(".pre-props", (el) => el.textContent!),
      );

      assertEquals(
        text,
        {
          number: 42,
          string: "foobar",
          boolean: false,
          null: null,
          object: { foo: 123456 },
          strArr: ["foo", "bar"],
        },
      );

      await assertNoPageComments(page);
    },
  );
});

Deno.test("serializes signals", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_props_signals`);
      await page.waitForSelector(".island");

      await page.click("button");
      await waitForText(page, ".output", "1");
      await assertNoPageComments(page);

      await page.click(".update-link");
      await page.waitForSelector(".status-update");
      await assertNoPageComments(page);

      // Currently, signal props are reset. This may change in
      // the future
      await waitForText(page, ".output", "0");
    },
  );
});

Deno.test("reconciles keyed islands", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/keys`);
      await page.waitForSelector(".island");

      await page.click(".btn-A");
      await waitForText(page, ".output-A", "1");
      await assertNoPageComments(page);

      await page.click(".btn-B");
      await waitForText(page, ".output-B", "1");
      await page.click(".btn-B");
      await waitForText(page, ".output-B", "2");
      await assertNoPageComments(page);

      await page.click(".btn-C");
      await waitForText(page, ".output-C", "1");
      await page.click(".btn-C");
      await waitForText(page, ".output-C", "2");
      await page.click(".btn-C");
      await waitForText(page, ".output-C", "3");
      await assertNoPageComments(page);

      await page.click(".swap-link");
      await page.waitForSelector(".status-swap");
      await assertNoPageComments(page);

      // Check that result is stable
      await waitForText(page, ".output-A", "1");
      await waitForText(page, ".output-B", "2");
      await waitForText(page, ".output-C", "3");
    },
  );
});

Deno.test("reconciles keyed DOM nodes", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/keys_dom`);
      await page.waitForSelector(".island");

      await page.click(".btn-A");
      await waitForText(page, ".output-A", "1");
      await assertNoPageComments(page);

      await page.click(".btn-B");
      await waitForText(page, ".output-B", "1");
      await page.click(".btn-B");
      await waitForText(page, ".output-B", "2");
      await assertNoPageComments(page);

      await page.click(".btn-C");
      await waitForText(page, ".output-C", "1");
      await page.click(".btn-C");
      await waitForText(page, ".output-C", "2");
      await page.click(".btn-C");
      await waitForText(page, ".output-C", "3");
      await assertNoPageComments(page);

      await page.click(".swap-link");
      await page.waitForSelector(".status-swap");
      await assertNoPageComments(page);

      // Check that result is stable
      await waitForText(page, ".output-A", "1");
      await waitForText(page, ".output-B", "2");
      await waitForText(page, ".output-C", "3");

      // Check that no element has `data-fresh-key` attribute
      const doc = parseHtml(await page.content());
      assertNotSelector(doc, "[data-fresh-key]");
    },
  );
});

Deno.test("reconciles keyed non island components", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/keys_components`);
      await page.waitForSelector(".island");

      await page.click(".btn-A");
      await waitForText(page, ".output-A", "1");
      await assertNoPageComments(page);

      await page.click(".btn-B");
      await waitForText(page, ".output-B", "1");
      await page.click(".btn-B");
      await waitForText(page, ".output-B", "2");
      await assertNoPageComments(page);

      await page.click(".btn-C");
      await waitForText(page, ".output-C", "1");
      await page.click(".btn-C");
      await waitForText(page, ".output-C", "2");
      await page.click(".btn-C");
      await waitForText(page, ".output-C", "3");
      await assertNoPageComments(page);

      await page.click(".swap-link");
      await page.waitForSelector(".status-swap");
      await assertNoPageComments(page);

      // Check that result is stable
      await waitForText(page, ".output-A", "1");
      await waitForText(page, ".output-B", "2");
      await waitForText(page, ".output-C", "3");

      // Check that no element has `data-fresh-key` attribute
      const doc = parseHtml(await page.content());
      assertNotSelector(doc, "[data-fresh-key]");
    },
  );
});

Deno.test("don't serialize keys for nodes outside islands or partials", async () => {
  await withFakeServe("./tests/fixture_partials/main.ts", async (server) => {
    const doc = await server.getHtml("/keys_outside");
    assertNoComments(doc);
  });
});

Deno.test("doesn't confuse islands starting with 'key' with key marker", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/keys_confusion`);
      await page.waitForSelector(".island");

      await page.click("button");
      await waitForText(page, ".output", "1");
    },
  );
});

Deno.test("partial injection mode", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/mode`);
      await page.waitForSelector(".island");

      await page.click("button");
      await waitForText(page, ".output-a", "1");
      await assertNoPageComments(page);

      // Append
      await page.click(".append-link");
      await page.waitForSelector(".status-append");
      // Check that old content is still there
      await page.waitForSelector(".status-initial");
      await assertNoPageComments(page);

      // Check that newly inserted island is interactive
      await page.click(".island-other button");
      await waitForText(page, ".output-other", "1");
      await assertNoPageComments(page);

      // Prepend
      await page.click(".prepend-link");
      await page.waitForSelector(".status-prepend");
      // Check that old content is still there
      await page.waitForSelector(".status-append");
      await page.waitForSelector(".status-initial");
      await assertNoPageComments(page);

      // Replace
      await page.click(".replace-link");
      await page.waitForSelector(".status-replace");
      await assertNoPageComments(page);

      const doc = parseHtml(await page.content());
      assertNotSelector(doc, ".status-append");
      assertNotSelector(doc, ".status-prepend");
    },
  );
});

Deno.test("partial navigation", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      const initialUrl = `${address}/mode`;
      await page.goto(initialUrl);
      await page.waitForSelector(".island");

      await page.click(".append-link");
      await page.waitForSelector(".status-append");
      await assertNoPageComments(page);

      await page.click(".island-other button");
      await waitForText(page, ".output-other", "1");
      await assertNoPageComments(page);

      const url = page.url();

      // Click link again
      await page.click(".append-link");
      await page.waitForFunction(() =>
        document.querySelectorAll(".status-append").length > 1
      );
      assertEquals(page.url(), url);
      await assertNoPageComments(page);

      // Go back
      await page.goBack();
      await page.waitForFunction(() =>
        document.querySelectorAll(".island").length === 1
      );
      assertEquals(page.url(), initialUrl);
      await waitFor(async () => {
        const doc = parseHtml(await page.content());
        return /mount Counter A/.test(doc.querySelector("pre")!.textContent!);
      });
      await assertNoPageComments(page);
    },
  );
});

Deno.test("non-partial client navigation", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      const initialUrl = `${address}/client_nav`;
      await page.goto(initialUrl);
      await page.waitForSelector(".island");

      // Add marker to check if the page reloaded or not
      await page.evaluate(() => {
        const marker = document.createElement("fresh-nav-marker");
        document.body.appendChild(marker);
      });

      await page.click(".island-a button");
      await waitForText(page, ".output-a", "1");
      await assertNoPageComments(page);

      // Go to page B
      await page.click(".page-b-link");
      await page.waitForSelector(".island-b");

      let doc = parseHtml(await page.content());
      assertNotSelector(doc, ".island-a");
      assertSelector(doc, "fresh-nav-marker");
      assertEquals(page.url(), `${address}/client_nav/page-b`);

      await page.click(".island-b button");
      await waitForText(page, ".output-b", "1");
      await assertNoPageComments(page);

      // Go to page C
      await page.click(".page-c-link");
      await page.waitForSelector(".page-c-text");

      doc = parseHtml(await page.content());
      assertNotSelector(doc, ".island-a");
      assertNotSelector(doc, ".island-b");
      assertSelector(doc, "fresh-nav-marker");
      assertEquals(page.url(), `${address}/client_nav/page-c`);

      // Go back to B
      await page.goBack();
      await page.waitForSelector(".island-b");

      doc = parseHtml(await page.content());
      assertNotSelector(doc, ".island-a");
      assertSelector(doc, "fresh-nav-marker");
      assertNotSelector(doc, ".page-c-text");

      // Non-shared state is reset
      assertTextMany(doc, ".output-b", ["0"]);

      // Check that island is interactive
      await page.click(".island-b button");
      await waitForText(page, ".output-b", "1");
      await assertNoPageComments(page);

      // Go back to A
      await page.goBack();
      await page.waitForSelector(".island-a");

      doc = parseHtml(await page.content());
      assertNotSelector(doc, ".island-b");
      assertNotSelector(doc, ".page-c-text");
      assertSelector(doc, "fresh-nav-marker");

      // Non-shared state is reset
      assertTextMany(doc, ".output-a", ["0"]);

      // Check that island is interactive
      await page.click(".island-a button");
      await waitForText(page, ".output-a", "1");
      await assertNoPageComments(page);

      // Go forward to B
      await page.goForward();
      await page.waitForSelector(".island-b");

      doc = parseHtml(await page.content());
      assertNotSelector(doc, ".island-a");
      assertNotSelector(doc, ".page-c-text");
      assertSelector(doc, "fresh-nav-marker");

      // Non-shared state is reset
      assertTextMany(doc, ".output-b", ["0"]);

      // Check that island is interactive
      await page.click(".island-b button");
      await waitForText(page, ".output-b", "1");
      await assertNoPageComments(page);
    },
  );
});

Deno.test("allow opting out of client navigation", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      const initialUrl = `${address}/client_nav_opt_out`;
      await page.goto(initialUrl);
      await page.waitForSelector(".island");

      async function addMarker() {
        await page.evaluate(() => {
          const marker = document.createElement("fresh-nav-marker");
          document.body.appendChild(marker);
        });
      }

      // Add marker to check if the page reloaded or not
      await addMarker();

      await page.click(".island-a button");
      await waitForText(page, ".output-a", "1");
      await assertNoPageComments(page);

      // Go to page B
      await page.click(".page-b-link");
      await page.waitForSelector(".island-b");

      let doc = parseHtml(await page.content());
      assertNotSelector(doc, ".island-a");
      assertNotSelector(doc, "fresh-nav-marker");
      assertEquals(page.url(), `${address}/client_nav_opt_out/page-b`);

      await page.click(".island-b button");
      await waitForText(page, ".output-b", "1");
      await assertNoPageComments(page);

      // Add marker to check if the page reloaded or not
      await addMarker();

      // Go to page C
      await page.click(".page-c-link");
      await page.waitForSelector(".page-c-text");

      doc = parseHtml(await page.content());
      assertNotSelector(doc, ".island-a");
      assertNotSelector(doc, ".island-b");
      assertNotSelector(doc, "fresh-nav-marker");
      assertEquals(page.url(), `${address}/client_nav_opt_out/page-c`);

      // Add marker to check if the page reloaded or not
      await addMarker();

      // Go back to B
      await page.goBack();
      await page.waitForSelector(".island-b");

      doc = parseHtml(await page.content());
      assertNotSelector(doc, ".island-a");
      assertNotSelector(doc, "fresh-nav-marker");
      assertNotSelector(doc, ".page-c-text");

      // Non-shared state is reset
      assertTextMany(doc, ".output-b", ["0"]);

      // Check that island is interactive
      await page.click(".island-b button");
      await waitForText(page, ".output-b", "1");
      await assertNoPageComments(page);

      // Go back to A
      await page.goBack();
      await page.waitForSelector(".island-a");

      doc = parseHtml(await page.content());
      assertNotSelector(doc, ".island-b");
      assertNotSelector(doc, ".page-c-text");
      assertNotSelector(doc, "fresh-nav-marker");

      // Non-shared state is reset
      assertTextMany(doc, ".output-a", ["0"]);

      // Check that island is interactive
      await page.click(".island-a button");
      await waitForText(page, ".output-a", "1");
      await assertNoPageComments(page);

      // Go forward to B
      await page.goForward();
      await page.waitForSelector(".island-b");

      doc = parseHtml(await page.content());
      assertNotSelector(doc, ".island-a");
      assertNotSelector(doc, ".page-c-text");
      assertNotSelector(doc, "fresh-nav-marker");

      // Non-shared state is reset
      assertTextMany(doc, ".output-b", ["0"]);

      // Check that island is interactive
      await page.click(".island-b button");
      await waitForText(page, ".output-b", "1");
    },
  );
});

Deno.test("allow opting out of client navigation if parent opted in", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      const initialUrl = `${address}/client_nav_both`;
      await page.goto(initialUrl);
      await page.waitForSelector(".island");

      await page.click(".island-a button");
      await waitForText(page, ".output-a", "1");

      // Go to page B
      await page.click(".page-b-link");
      await page.waitForSelector(".island-b");
      await assertLogs(page, ["mount Counter B"]);

      await page.click(".island-b button");
      await waitForText(page, ".output-b", "1");
      await assertLogs(page, ["mount Counter B", "update Counter B"]);

      // Go to page C
      await page.click(".page-c-link");
      await page.waitForSelector(".page-c-text");
      await assertLogs(page, []);

      // Go back to B
      await page.goBack();
      await page.waitForSelector(".island-b");
      await assertLogs(page, ["mount Counter B"]);

      // Check that island is interactive
      await page.click(".island-b button");
      await waitForText(page, ".output-b", "1");

      // Go back to A
      await page.goBack();
      await page.waitForSelector(".island-a");
      await assertLogs(page, ["mount Counter A"]);

      // Check that island is interactive
      await page.click(".island-a button");
      await waitForText(page, ".output-a", "1");
      await assertNoPageComments(page);

      // Go forward to B
      await page.goForward();
      await page.waitForSelector(".island-b");
      await assertLogs(page, ["mount Counter B"]);

      // Check that island is interactive
      await page.click(".island-b button");
      await waitForText(page, ".output-b", "1");
    },
  );
});

Deno.test("restore scroll position", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      const initialUrl = `${address}/scroll_restoration`;
      await page.goto(initialUrl);
      await page.waitForSelector(".status-initial");

      await page.evaluate(() => {
        document.querySelector(".update-link")?.scrollIntoView({
          behavior: "instant",
        });
      });

      await page.click(".update-link");
      await page.waitForSelector(".status-updated");

      await page.goBack();
      await page.waitForSelector(".status-initial");
      const scroll = await page.evaluate(() => ({ scrollX, scrollY }));

      assert(scroll.scrollY > 100, `Page did not scroll ${scroll.scrollY}`);
    },
  );
});

Deno.test("shows loading indicator if trigger outside island", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      const initialUrl = `${address}/loading`;
      await page.goto(initialUrl);
      await page.waitForSelector(".status");

      let doc = parseHtml(await page.content());
      assertNotSelector(doc, ".spinner");

      await Promise.all([
        page.waitForSelector(".spinner-inner"),
        page.waitForSelector(".spinner-outer"),
        page.click(".update-link"),
      ]);

      await page.waitForSelector(".status-updated");
      await assertNoPageComments(page);

      doc = parseHtml(await page.content());
      assertNotSelector(doc, ".spinner");
    },
  );
});

Deno.test("shows loading indicator if trigger inside island", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      const initialUrl = `${address}/loading`;
      await page.goto(initialUrl);
      await page.waitForSelector(".status");

      let doc = parseHtml(await page.content());
      assertNotSelector(doc, ".spinner");

      await Promise.all([
        page.waitForSelector(".spinner-inner"),
        page.waitForSelector(".spinner-outer"),
        page.click(".trigger"),
      ]);

      await page.waitForSelector(".status-updated");
      await assertNoPageComments(page);

      doc = parseHtml(await page.content());
      assertNotSelector(doc, ".spinner");
    },
  );
});

Deno.test("submit form", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      const initialUrl = `${address}/form`;
      await page.goto(initialUrl);
      await page.waitForSelector(".status");

      await page.click(".submit");
      await page.waitForSelector(".status-updated");
      await assertNoPageComments(page);
    },
  );
});

Deno.test("submit form GET", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      const initialUrl = `${address}/form_get`;
      await page.goto(initialUrl);
      await page.waitForSelector(".status");

      await page.type("input", "foobar");

      await page.click(".submit");
      await waitFor(async () => {
        const logEl = await page.$eval("#logs", (el) => el.textContent);
        return /update Form/.test(logEl);
      });

      const url = await page.$eval(".url", (el) => el.textContent);
      assertEquals(url, `${address}/form_get?name=foobar&fresh-partial=true`);

      const pageUrl = page.url();
      assertEquals(pageUrl, `${address}/form_get?name=foobar`);

      // Server can update form value
      const value = await page.$eval("input", (el) => el.value);
      assertEquals(value, "foobar_foo");

      const logs = await page.$eval("#logs", (el) => el.textContent);
      assertEquals(logs.split(/\n/).filter(Boolean), [
        "mount Form",
        "update Form",
      ]);
    },
  );
});

Deno.test("submit form POST", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/form_post`);
      await page.waitForSelector(".status");

      await page.type("input", "foobar");

      await page.click(".submit");
      await waitFor(async () => {
        const logEl = await page.$eval("#logs", (el) => el.textContent);
        return /update Form/.test(logEl);
      });

      const url = await page.$eval(".url", (el) => el.textContent);
      assertEquals(url, `${address}/form_post?fresh-partial=true`);

      const logs = await page.$eval("#logs", (el) => el.textContent);
      assertEquals(logs.split(/\n/).filter(Boolean), [
        "mount Form",
        "update Form",
      ]);

      // Server can update form value
      const value = await page.$eval("input", (el) => el.value);
      assertEquals(value, "foobar_foo");
    },
  );
});

Deno.test("pull values from event.submitter if set", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/form_submitter`);
      await page.waitForSelector(".status");

      await page.type("input", "foobar");

      await page.click(".submit");
      await waitFor(async () => {
        const logEl = await page.$eval("#logs", (el) => el.textContent);
        return /update Form/.test(logEl);
      });

      const url = await page.$eval(".url", (el) => el.textContent);
      assertEquals(url, `${address}/form_submitter?fresh-partial=true`);

      const logs = await page.$eval("#logs", (el) => el.textContent);
      assertEquals(logs.split(/\n/).filter(Boolean), [
        "mount Form",
        "update Form",
      ]);

      // Server can update form value
      const value = await page.$eval("input", (el) => el.value);
      assertEquals(value, "foobar_foo");
    },
  );
});

Deno.test("pull values from event.submitter if set with f-partial", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/form_submitter_partial`);
      await page.waitForSelector(".status");

      await page.type("input", "foobar");

      await page.click(".submit");
      await waitFor(async () => {
        const logEl = await page.$eval("#logs", (el) => el.textContent);
        return /update Form/.test(logEl);
      });

      const url = await page.$eval(".url", (el) => el.textContent);
      assertEquals(url, `${address}/form_submitter_partial?fresh-partial=true`);

      const logs = await page.$eval("#logs", (el) => el.textContent);
      assertEquals(logs.split(/\n/).filter(Boolean), [
        "mount Form",
        "update Form",
      ]);

      // Server can update form value
      const value = await page.$eval("input", (el) => el.value);
      assertEquals(value, "foobar_foo");
    },
  );
});

Deno.test("should apply partials if submitter parent has no client nav", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/form_submitter_partial_no_client_nav`);
      await page.waitForSelector(".status");

      await page.type("input", "foobar");

      await Promise.all([
        page.waitForNavigation(),
        page.click(".submit"),
      ]);

      await page.waitForSelector(".url");

      const url = await page.$eval(".url", (el) => el.textContent);
      assertEquals(
        url,
        `${address}/form_submitter_partial_no_client_nav`,
      );

      await waitFor(async () => {
        const logEl = await page.$eval("#logs", (el) => el.textContent);
        return /mount Form/.test(logEl);
      });

      // Server can update form value
      const value = await page.$eval("input", (el) => el.value);
      assertEquals(value, "foobar_foo");
    },
  );
});

Deno.test("fragment navigation should not cause loop", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      const logs: string[] = [];
      page.on("console", (msg) => logs.push(msg.text()));

      await page.goto(`${address}/fragment_nav`);
      await page.waitForSelector(".partial-text");

      await page.click("a");

      await page.waitForFunction(() => location.hash === "#foo");
      assertEquals(logs, []);
    },
  );
});

Deno.test("fragment navigation should not scroll to top", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/fragment_nav_scroll`);
      await page.waitForSelector(".partial-text");

      await page.click("a");
      await page.waitForFunction(() => location.hash === "#foo");

      const scroll = await page.evaluate(() => globalThis.scrollY);
      assert(scroll > 0, `Did not scroll to fragment`);
    },
  );
});

Deno.test("active links without client nav", async () => {
  await withFakeServe(
    "./tests/fixture_partials/main.ts",
    async (server) => {
      let doc = await server.getHtml(`/active_nav`);
      assertSelector(doc, "a[href='/'][data-ancestor]");

      // Current
      assertNotSelector(doc, "a[href='/active_nav'][data-ancestor]");
      assertSelector(doc, "a[href='/active_nav'][data-current]");
      assertSelector(doc, `a[href='/active_nav'][aria-current="page"]`);

      // Unrelated links
      assertNotSelector(doc, "a[href='/active_nav/foo'][data-ancestor]");
      assertNotSelector(doc, "a[href='/active_nav/foo'][aria-current]");
      assertNotSelector(doc, "a[href='/active_nav/foo/bar'][data-ancestor]");
      assertNotSelector(doc, "a[href='/active_nav/foo/bar'][aria-current]");

      doc = await server.getHtml(`/active_nav/foo`);
      assertSelector(doc, "a[href='/active_nav/foo'][data-current]");
      assertSelector(doc, `a[href='/active_nav/foo'][aria-current="page"]`);
      assertSelector(doc, "a[href='/active_nav'][data-ancestor]");
      assertSelector(doc, `a[href='/active_nav'][aria-current="true"]`);
      assertSelector(doc, "a[href='/'][data-ancestor]");
      assertSelector(doc, `a[href='/'][aria-current="true"]`);
    },
  );
});

Deno.test("Updates active links outside of vdom", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/active_nav_partial`);

      let doc = parseHtml(await page.content());
      assertSelector(doc, "a[href='/'][data-ancestor]");

      // Current
      assertNotSelector(doc, "a[href='/active_nav_partial'][data-ancestor]");
      assertSelector(doc, "a[href='/active_nav_partial'][data-current]");
      assertSelector(doc, `a[href='/active_nav_partial'][aria-current="page"]`);

      // Unrelated links
      assertNotSelector(
        doc,
        "a[href='/active_nav_partial/foo'][data-ancestor]",
      );
      assertNotSelector(
        doc,
        "a[href='/active_nav_partial/foo'][aria-current]",
      );
      assertNotSelector(
        doc,
        "a[href='/active_nav_partial/foo/bar'][data-ancestor]",
      );
      assertNotSelector(
        doc,
        "a[href='/active_nav_partial/foo/bar'][aria-current]",
      );

      await page.goto(`${address}/active_nav_partial/foo`);
      doc = parseHtml(await page.content());
      assertSelector(doc, "a[href='/active_nav_partial/foo'][data-current]");
      assertSelector(
        doc,
        `a[href='/active_nav_partial/foo'][aria-current="page"]`,
      );
      assertSelector(doc, "a[href='/active_nav_partial'][data-ancestor]");
      assertSelector(
        doc,
        `a[href='/active_nav_partial'][data-ancestor][aria-current="true"]`,
      );
      assertSelector(doc, "a[href='/'][data-ancestor]");
      assertSelector(doc, `a[href='/'][aria-current="true"]`);
    },
  );
});

Deno.test("throws an error when response contains no partials", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      const logs: string[] = [];
      page.on("pageerror", (msg) => logs.push(msg.message));

      await page.goto(`${address}/no_partial_response`);
      await waitFor(async () => {
        const logEl = await page.$eval("#logs", (el) => el.textContent);
        return /mount Counter/.test(logEl);
      });

      await page.click(".update-link");

      await waitFor(() => logs.length > 0);
      assertMatch(logs[0], /Found no partials/);
    },
  );
});

Deno.test("merges <head> content", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/head_merge`);
      await page.waitForSelector(".status-initial");

      await page.click(".update-link");
      await page.waitForSelector(".status-updated");

      await waitFor(async () => {
        return (await page.title()) === "Head merge updated";
      });

      const doc = parseHtml(await page.content());
      assertEquals(doc.title, "Head merge updated");

      assertMetaContent(doc, "foo", "bar baz");
      assertMetaContent(doc, "og:foo", "og value foo");
      assertMetaContent(doc, "og:bar", "og value bar");

      const color = await page.$eval("h1", (el) => {
        return globalThis.getComputedStyle(el).color;
      });
      assertEquals(color, "rgb(255, 0, 0)");

      const textColor = await page.$eval("p", (el) => {
        return globalThis.getComputedStyle(el).color;
      });
      assertEquals(textColor, "rgb(0, 128, 0)");
    },
  );
});

Deno.test("does not merge duplicate <head> content", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/head_merge`);
      await page.waitForSelector(".status-initial");

      await page.click(".duplicate-link");
      await page.waitForSelector(".status-duplicated");

      await waitFor(async () => {
        return (await page.title()) === "Head merge duplicated";
      });

      const html = await page.content();
      assert(
        Array.from(html.matchAll(/id="style-foo"/g)).length === 1,
        `Duplicate style tag found`,
      );

      assert(
        Array.from(html.matchAll(/style\.css/g)).length === 1,
        `Duplicate link stylesheet found`,
      );
    },
  );
});

Deno.test("applies f-partial on <button>", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/button`);
      await page.waitForSelector(".status-initial");

      await page.click("button");
      await page.waitForSelector(".status-updated");
    },
  );
});

Deno.test("supports relative links", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/relative_link`);
      await page.waitForSelector(".status-initial");

      await page.click("button");
      await page.waitForSelector(".status-refreshed");
    },
  );
});

Deno.test("nested partials are able to be updated", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/nested`);
      await page.waitForSelector(".status-outer");
      await page.waitForSelector(".status-inner");

      await page.click(".update-outer");
      await waitForText(page, ".status-outer", "updated outer");
      await waitForText(page, ".status-inner", "inner");

      await page.click(".update-inner");
      await waitForText(page, ".status-outer", "updated outer");
      await waitForText(page, ".status-inner", "updated inner");

      await page.click(".update-outer");
      await waitForText(page, ".status-outer", "updated outer");
      await waitForText(page, ".status-inner", "inner");
    },
  );
});

Deno.test("errors on duplicate partial name", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/duplicate_name`);
      await page.waitForSelector(".swap-link");

      const logs: string[] = [];
      page.on("console", (msg) => logs.push(msg.text()));

      await Promise.all([
        page.waitForResponse((res) => res.status() === 500),
        page.click(".swap-link"),
      ]);
    },
  );
});

Deno.test("normal visit to handler page", async () => {
  await withFakeServe(
    "./tests/fixture_partials/main.ts",
    async (server) => {
      const html = await server.getHtml("/isPartial/handler");
      assertEquals(JSON.parse(html.querySelector("pre")!.textContent!), {
        isPartial: false,
        notSetFromMiddleware: true,
      });
    },
  );
});

Deno.test("normal visit to async page", async () => {
  await withFakeServe(
    "./tests/fixture_partials/main.ts",
    async (server) => {
      const html = await server.getHtml("/isPartial/async");
      assertEquals(JSON.parse(html.querySelector("pre")!.textContent!), {
        isPartial: false,
        notSetFromMiddleware: true,
      });
    },
  );
});

Deno.test("partials visit to handler page", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/isPartial`);
      await page.waitForSelector(".output");

      const href = await page.$eval(".handler-update-link", (el) => el.href);
      await page.click(".handler-update-link");
      await page.waitForSelector("pre");

      assertEquals(href, await page.url());
      await assertNoPageComments(page);
      const result = await page.$eval("pre", (el) => {
        return el.textContent;
      });
      assertEquals(JSON.parse(result), {
        isPartial: true,
        setFromMiddleware: true,
      });
    },
  );
});

Deno.test("partials visit to async page", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/isPartial`);
      await page.waitForSelector(".output");

      const href = await page.$eval(".async-update-link", (el) => el.href);
      await page.click(".async-update-link");
      await page.waitForSelector("pre");

      assertEquals(href, await page.url());
      await assertNoPageComments(page);
      const result = await page.$eval("pre", (el) => {
        return el.textContent;
      });
      assertEquals(JSON.parse(result), {
        isPartial: true,
        setFromMiddleware: true,
      });
    },
  );
});

Deno.test("partials with redirects", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/redirected`);
      await page.waitForSelector(".output");

      await page.click(".update-link");
      await page.waitForSelector(".status-updated");
    },
  );
});

Deno.test("render 404 partial", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/error_404`);
      await page.waitForSelector(".status");

      await page.click(".update-link");
      await page.waitForSelector(".status-404");
    },
  );
});

Deno.test("render partial with title", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/head_merge`);
      await page.waitForSelector(".status-initial");

      await page.click(".duplicate-link");
      await page.waitForSelector(".status-duplicated");

      const doc = parseHtml(await page.content());
      assertEquals(doc.title, "Head merge duplicated");
    },
  );
});

Deno.test("render partial without title", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      await page.goto(`${address}/head_merge`);
      await page.click(".without-title");

      await page.waitForSelector(".page-without-title");

      const doc = parseHtml(await page.content());
      assertEquals(doc.title, "Head merge");
    },
  );
});

// See https://github.com/denoland/fresh/issues/2254
Deno.test("should not be able to override __FRSH_STATE", async () => {
  await withPageName(
    "./tests/fixture_partials/main.ts",
    async (page, address) => {
      let didError = false;
      page.on("pageerror", (ev) => {
        didError = true;
        console.log(ev);
      });
      await page.goto(`${address}/spoof_state`);

      await page.click("a");
      await page.waitForSelector(".raw_ready");

      assert(!didError);
    },
  );
});
