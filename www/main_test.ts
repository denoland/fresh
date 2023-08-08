import { assertArrayIncludes, assertEquals } from "$std/testing/asserts.ts";
import { delay } from "$std/async/delay.ts";
import { startFreshServer, withPageName } from "../tests/test_utils.ts";
import { dirname, join } from "$std/path/mod.ts";
import VERSIONS from "../versions.json" assert { type: "json" };

const dir = dirname(import.meta.url);

Deno.test("CORS should not set on GET /fresh-badge.svg", {
  sanitizeResources: false,
}, async () => {
  const { serverProcess, lines, address } = await startFreshServer({
    args: ["run", "-A", join(dir, "./main.ts")],
  });

  const res = await fetch(`${address}/fresh-badge.svg`);
  await res.body?.cancel();

  assertEquals(res.headers.get("cross-origin-resource-policy"), null);

  await lines.cancel();
  serverProcess.kill("SIGTERM");
  // await for the server to close
  await delay(100);
});

Deno.test("shows version selector", {
  sanitizeResources: false,
}, async () => {
  await withPageName(join(dir, "./main.ts"), async (page, address) => {
    await page.goto(`${address}/docs`);
    await page.waitForSelector("#version");

    // Check that we redirected to the first page
    assertEquals(page.url(), `${address}/docs/introduction`);

    // Wait for version selector to be enabled
    await page.waitForSelector("#version:not([disabled])");

    const options = await page.$eval("#version", (el: HTMLSelectElement) => {
      return Array.from(el.options).map((option) => ({
        value: option.value,
        label: option.textContent,
      }));
    });

    assertEquals(options.length, 2);
    assertArrayIncludes(options, [
      {
        value: "canary",
        label: "canary",
      },
      {
        value: "latest",
        label: VERSIONS[0],
      },
    ]);

    const selectValue = await page.$eval(
      "#version",
      (el: HTMLSelectElement) => el.value,
    );
    assertEquals(selectValue, "latest");

    // Go to canary page
    await Promise.all([
      page.waitForNavigation(),
      page.select("#version", "canary"),
    ]);

    await page.waitForSelector("#version:not([disabled])");
    const selectValue2 = await page.$eval(
      "#version",
      (el: HTMLSelectElement) => el.value,
    );
    assertEquals(selectValue2, "canary");

    assertEquals(page.url(), `${address}/docs/canary/introduction`);
  });
});
