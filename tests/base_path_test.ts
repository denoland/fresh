import {
  assert,
  assertEquals,
  assertMatch,
  assertStringIncludes,
  delay,
  Page,
  Project,
  puppeteer,
  STATUS_CODE,
} from "./deps.ts";
import {
  clickWhenListenerReady,
  getErrorOverlay,
  runBuild,
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
    assertEquals(body, "middleware is working");
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
      (el) => globalThis.getComputedStyle(el).color,
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

Deno.test("assets prefixed dev", async (t) => {
  await withPageName(
    "./tests/fixture_base_path/dev.ts",
    async (page, address) => {
      await page.goto(`${address}/islands`);

      await t.step("ensure every preload link is prefixed", async () => {
        await checkPreloadLinks(page, "/foo/bar");
      });

      await t.step("ensure every script link is prefixed", async () => {
        await checkScriptSrcs(page, "/foo/bar");
      });

      await t.step("ensure inline content is prefixed", async () => {
        await checkInlineScripts(page, "/foo/bar");
      });
    },
  );
});

Deno.test("assets prefixed main", async (t) => {
  await withPageName(
    "./tests/fixture_base_path/main.ts",
    async (page, address) => {
      await page.goto(`${address}/islands`);

      await t.step("ensure every preload link is prefixed", async () => {
        await checkPreloadLinks(page, "/foo/bar");
      });

      // no script sent out, because dev sends out dev_client.js

      await t.step("ensure inline content is prefixed", async () => {
        await checkInlineScripts(page, "/foo/bar");
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

Deno.test("TailwindCSS - dev mode", async () => {
  await withFakeServe("./tests/fixture_base_path/dev.ts", async (server) => {
    const res = await server.get("/styles.css");
    const content = await res.text();
    assertStringIncludes(content, ".text-red-600");

    const res2 = await server.get("/styles.css?foo=bar");
    const content2 = await res2.text();
    assert(!content2.includes("@tailwind"));
  }, { loadConfig: true });
});

Deno.test("middleware test", async (t) => {
  await withFakeServe(
    "./tests/fixture_base_path/dev.ts",
    async (server) => {
      await t.step("expected root", async () => {
        const res = await server.get("/foo/bar");
        const content = await res.text();
        assertEquals(res.headers.get("server"), "fresh server");
        assertStringIncludes(content, "middleware is working");
      });

      await t.step("redirect root", async () => {
        const res = await server.get("");
        const content = await res.text();
        assertEquals(res.headers.get("server"), "fresh server");
        assertStringIncludes(content, "middleware is working");
      });

      await t.step("miiddleware before an invalid route", async () => {
        const res = await server.get("/asdfasdfasdfasdfasdfasdf");
        assertEquals(res.headers.get("server"), "fresh server");
        await res.body?.cancel();
      });
    },
    { loadConfig: true },
  );
});

Deno.test("TailwindCSS - build mode", async () => {
  await runBuild("./tests/fixture_base_path_build/dev.ts");
  await withFakeServe(
    "./tests/fixture_base_path_build/main.ts",
    async (server) => {
      const res = await server.get("/styles.css");
      const content = await res.text();
      assertStringIncludes(content, ".text-red-600{");
    },
    { loadConfig: true },
  );
});

Deno.test("TailwindCSS - config", async () => {
  await withFakeServe(
    "./tests/fixture_base_path_config/dev.ts",
    async (server) => {
      const res = await server.get("/styles.css");
      const content = await res.text();
      assertStringIncludes(content, ".text-pp");
    },
    { loadConfig: true },
  );
});

Deno.test("TailwindCSS - middleware only css", async () => {
  await withFakeServe(
    "./tests/fixture_base_path/dev.ts",
    async (server) => {
      const res = await server.get("/middleware-only.css");
      const content = await res.text();
      assertStringIncludes(content, ".foo-bar");
    },
    { loadConfig: true },
  );
});

function extractImportUrls(scriptContent: string): string[] {
  const project = new Project({
    useInMemoryFileSystem: true,
  });

  const sourceFile = project.createSourceFile("script.js", scriptContent);

  const importDeclarations = sourceFile.getImportDeclarations();

  return importDeclarations.map((importDeclaration) =>
    importDeclaration.getModuleSpecifierValue()
  );
}

async function checkPreloadLinks(page: Page, basePath: string) {
  const preloadLinks: string[] = await page.$$eval(
    'link[rel="modulepreload"]',
    (links) => links.map((link) => link.getAttribute("href")),
  );
  assert(preloadLinks.length > 0, "No preload links found");
  preloadLinks.forEach((href) => {
    assert(
      href.startsWith(basePath),
      `Preload link ${href} does not include the correct base path`,
    );
  });
}

async function checkScriptSrcs(page: Page, basePath: string) {
  const scriptSrcs: string[] = await page.$$eval(
    "script[src]",
    (scripts) => scripts.map((script) => script.getAttribute("src")),
  );
  assert(scriptSrcs.length > 0, "No script srcs found");
  scriptSrcs.forEach((src) => {
    assert(
      src.startsWith(basePath),
      `Script src ${src} does not include the correct base path`,
    );
  });
}

async function checkInlineScripts(page: Page, basePath: string) {
  const inlineScripts = await page.$$eval(
    "script:not([src])",
    (scripts) => scripts.map((script) => script.textContent),
  );
  assert(inlineScripts.length > 0, "No inline scripts found");
  inlineScripts.forEach((scriptContent) => {
    const importUrls = extractImportUrls(scriptContent);
    importUrls.forEach((url) => {
      assert(
        url.startsWith(basePath),
        `Import URL ${url} does not include the correct base path`,
      );
    });
  });
}
