import {
  assert,
  assertEquals,
  assertMatch,
  delay,
  puppeteer,
  STATUS_CODE,
} from "./deps.ts";
import {
  clickWhenListenerReady,
  getErrorOverlay,
  waitForText,
  withFakeServe,
  withFresh,
  withPageName,
} from "./test_utils.ts";

Deno.test("redirects on incomplete base path in url", async () => {
  await withFresh("./tests/fixture_base_path/main.ts", async (address) => {
    await delay(100);

    const url = new URL(address);
    const res = await fetch(url.origin);
    assert(
      res.url.endsWith("/foo/bar"),
      `didn't redirect to base path: "${res.url}"`,
    );
    assert(res.redirected, "did not redirect");
    assertEquals(res.status, STATUS_CODE.OK);
    await res.body?.cancel();
  });
});

Deno.test("shows full address with base path in cli", async () => {
  // deno-lint-ignore require-await
  await withFresh("./tests/fixture_base_path/main.ts", async (address) => {
    assertMatch(address, /^http:\/\/localhost:\d+\/foo\/bar$/);
  });
});

Deno.test("rewrites middleware request", async () => {
  await withFresh("./tests/fixture_base_path/main.ts", async (address) => {
    const res = await fetch(`${address}/api`);
    const body = await res.text();
    assertEquals(body, "it works");
  });
});

Deno.test("rewrites root relative middleware redirects", async () => {
  await withFresh("./tests/fixture_base_path/main.ts", async (address) => {
    const res = await fetch(`${address}/api/rewrite`);
    assertEquals(res.status, STATUS_CODE.OK);
    assertEquals(res.url, address);
    await res.body?.cancel();
  });
});

Deno.test("passes basePath to route handlers", async () => {
  await withFresh("./tests/fixture_base_path/main.ts", async (address) => {
    const res = await fetch(`${address}/api/base-handler`);
    assertEquals(res.status, STATUS_CODE.OK);
    assertEquals(await res.text(), "/foo/bar");
  });
});

Deno.test("works with relative urls", async () => {
  await withFresh("./tests/fixture_base_path/main.ts", async (address) => {
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.goto(`${address}/a/b/relative`);

    await Promise.all([
      page.waitForNavigation(),
      page.click("a"),
    ]);

    const html = await page.content();
    assertMatch(html, /it works/);
    await browser.close();
  });
});

Deno.test("rewrites root relative URLs in HTML", async () => {
  await withFresh("./tests/fixture_base_path/main.ts", async (address) => {
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.goto(`${address}/html`);

    const script = await page.$eval("#script-output", (el) => el.textContent);
    assertEquals(script, "it works");

    const img = await page.$eval("img", (el) => ({
      src: el.src,
    }));
    assertMatch(img.src, /\/foo\/bar\/img\.png/);

    const img2 = await page.$eval(".img-srcset", (el) => ({
      src: el.src,
      srcset: el.srcset,
    }));
    assertMatch(img2.src, /\/foo\/bar\/img\.png/);
    assertMatch(
      img2.srcset,
      /\/foo\/bar\/img\.png.* 480w,.*\/foo\/bar\/img\.png.* 800w/,
    );

    const source = await page.$eval("picture source", (el) => ({
      srcset: el.srcset,
    }));
    assertMatch(
      source.srcset,
      /\/foo\/bar\/img\.png/,
    );

    const style = await page.$eval(
      ".foo",
      (el) => window.getComputedStyle(el).color,
    );
    assertMatch(
      style,
      /rgb\(255,\s+0,\s+0\)/,
    );

    await browser.close();
  });
});

Deno.test("island tests", async (t) => {
  await withPageName(
    "./tests/fixture_base_path/main.ts",
    async (page, address) => {
      async function counterTest(counterId: string, originalValue: number) {
        const pElem = await page.waitForSelector(`#${counterId} > p`);

        const value = await pElem?.evaluate((el) => el.textContent);
        assert(value === `${originalValue}`, `${counterId} first value`);

        await clickWhenListenerReady(page, `#b-${counterId}`);
        await waitForText(page, `#${counterId} > p`, String(originalValue + 1));
      }

      await page.goto(`${address}/islands`);

      await t.step("Ensure 1 islands on 1 page are revived", async () => {
        await counterTest("counter1", 3);
      });
    },
  );
});

Deno.test("renders error boundary", async () => {
  await withPageName(
    "./tests/fixture_base_path/main.ts",
    async (page, address) => {
      await page.goto(`${address}/error_boundary`);
      const text = await page.$eval("p", (el) => el.textContent);
      assertEquals(text, "it works");
    },
  );
});

Deno.test("dev_command config: shows codeframe", async () => {
  await withFakeServe(
    "./tests/fixture_base_path/dev.ts",
    async (server) => {
      const { codeFrame } = await getErrorOverlay(server, "/codeframe");
      assert(codeFrame);
    },
  );
});
