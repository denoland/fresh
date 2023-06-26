import {
  assert,
  assertEquals,
  assertStringIncludes,
  delay,
  Page,
  puppeteer,
} from "./deps.ts";
import { startFreshServer } from "./test_utils.ts";

Deno.test({
  name: "island tests",
  async fn(t) {
    await withPage(async (page, address) => {
      async function counterTest(counterId: string, originalValue: number) {
        const pElem = await page.waitForSelector(`#${counterId} > p`);

        let value = await pElem?.evaluate((el) => el.textContent);
        assert(value === `${originalValue}`, `${counterId} first value`);

        const buttonPlus = await page.$(`#b-${counterId}`);
        await buttonPlus?.click();

        await delay(100);

        value = await pElem?.evaluate((el) => el.textContent);
        assert(value === `${originalValue + 1}`, `${counterId} click`);
      }

      await page.goto(`${address}/islands`, {
        waitUntil: "networkidle2",
      });

      await t.step("Ensure 4 islands on 1 page are revived", async () => {
        await counterTest("counter1", 3);
        await counterTest("counter2", 10);
        await counterTest("folder-counter", 3);
        await counterTest("kebab-case-file-counter", 5);
      });

      await t.step("Ensure an island revive an img 'hash' path", async () => {
        // Ensure src path has __frsh_c=
        const pElem = await page.waitForSelector(`#img-in-island`);
        const srcString = (await pElem?.getProperty("src"))?.toString()!;
        assertStringIncludes(srcString, "image.png?__frsh_c=");

        // Ensure src path is the same as server rendered
        const resp = await fetch(new Request(`${address}/islands`));
        const body = await resp.text();

        const imgFilePath = body.match(/img id="img-in-island" src="(.*?)"/)
          ?.[1]!;
        assertStringIncludes(srcString, imgFilePath);
      });
    });
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

function withPage(fn: (page: Page, address: string) => Promise<void>) {
  return withPageName("./tests/fixture/main.ts", fn);
}

async function withPageName(
  name: string,
  fn: (page: Page, address: string) => Promise<void>,
) {
  const { lines, serverProcess, address } = await startFreshServer({
    args: ["run", "-A", name],
  });

  try {
    await delay(100);
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });

    try {
      const page = await browser.newPage();
      await fn(page, address);
    } finally {
      await browser.close();
    }
  } finally {
    await lines.cancel();

    serverProcess.kill("SIGTERM");

    // Wait until the process exits
    await serverProcess.status;
  }
}

Deno.test({
  name: "island tests with </script>",

  async fn(t) {
    await withPage(async (page, address) => {
      page.on("dialog", () => {
        assert(false, "There is XSS");
      });

      await page.goto(`${address}/evil`, {
        waitUntil: "networkidle2",
      });

      await t.step("prevent XSS on Island", async () => {
        const bodyElem = await page.waitForSelector(`body`);
        const value = await bodyElem?.evaluate((el) => el.getInnerHTML());

        assertStringIncludes(
          value,
          `{"message":"\\u003c/script\\u003e\\u003cscript\\u003ealert('test')\\u003c/script\\u003e"}`,
          `XSS is not escaped`,
        );
      });
    });
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "island with fragment as root",

  async fn(_t) {
    await withPage(async (page, address) => {
      await page.goto(`${address}/islands/root_fragment`, {
        waitUntil: "networkidle2",
      });

      const clickableSelector = "#root-fragment-click-me";

      await page.waitForSelector(clickableSelector);

      const contentBeforeClick = await getIslandParentTextContent();
      assert(contentBeforeClick === "HelloWorld");

      await page.click(clickableSelector);
      await delay(100);

      const contentAfterClick = await getIslandParentTextContent();
      assert(contentAfterClick === "HelloWorldI'm rendered now");

      async function getIslandParentTextContent() {
        return await page.$eval(
          "#island-parent",
          (el: Element) => el.textContent,
        );
      }
    });
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "island with fragment as root and conditional child first",

  async fn(_t) {
    await withPage(async (page, address) => {
      await page.goto(
        `${address}/islands/root_fragment_conditional_first`,
        {
          waitUntil: "networkidle2",
        },
      );

      const clickableSelector = "#root-fragment-conditional-first-click-me";
      await page.waitForSelector(clickableSelector);

      const contentBeforeClick = await getIslandParentTextContent(page);
      assert(contentBeforeClick === "HelloWorld");

      await page.click(clickableSelector);
      await delay(100);

      const contentAfterClick = await getIslandParentTextContent(page);
      assert(contentAfterClick === "I'm rendered on topHelloWorld");
    });
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

async function getIslandParentTextContent(page: Page) {
  return await page.$eval("#island-parent", (el: Element) => el.textContent);
}

Deno.test({
  name: "island that returns `null`",

  async fn(_t) {
    await withPage(async (page, address) => {
      await page.goto(`${address}/islands/returning_null`, {
        waitUntil: "networkidle2",
      });

      await page.waitForSelector(".added-by-use-effect");
    });
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "island using `npm:` specifiers",

  async fn(_t) {
    await withPageName("./tests/fixture_npm/main.ts", async (page, address) => {
      await page.setJavaScriptEnabled(false);
      await page.goto(address, { waitUntil: "networkidle2" });
      assert(await page.waitForSelector("#server-true"));

      await page.setJavaScriptEnabled(true);
      await page.reload({ waitUntil: "networkidle2" });
      assert(await page.waitForSelector("#browser-true"));
    });
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "works with older preact-render-to-string v5",

  async fn(_t) {
    await withPageName(
      "./tests/fixture_preact_rts_v5/main.ts",
      async (page, address) => {
        await page.goto(address, {
          waitUntil: "networkidle2",
        });
        await page.waitForSelector("#foo");

        await delay(100);
        const text = await page.$eval("#foo", (el) => el.textContent);
        assertEquals(text, "it works");
      },
    );
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "pass single JSX child to island",

  async fn(_t) {
    await withPageName(
      "./tests/fixture_island_nesting/main.ts",
      async (page, address) => {
        await page.goto(`${address}/island_jsx_child`, {
          waitUntil: "networkidle2",
        });
        await page.waitForSelector(".island");

        await delay(100);
        const text = await page.$eval(".island", (el) => el.textContent);
        assertEquals(text, "it works");
      },
    );
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "pass multiple JSX children to island",

  async fn(_t) {
    await withPageName(
      "./tests/fixture_island_nesting/main.ts",
      async (page, address) => {
        await page.goto(`${address}/island_jsx_children`, {
          waitUntil: "networkidle2",
        });
        await page.waitForSelector(".island");

        await delay(100);
        const text = await page.$eval(".island", (el) => el.textContent);
        assertEquals(text, "it works");
      },
    );
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "pass multiple text JSX children to island",

  async fn(_t) {
    await withPageName(
      "./tests/fixture_island_nesting/main.ts",
      async (page, address) => {
        await page.goto(`${address}/island_jsx_text`, {
          waitUntil: "networkidle2",
        });
        await page.waitForSelector(".island");

        await delay(100);
        const text = await page.$eval(".island", (el) => el.textContent);
        assertEquals(text, "it works");
      },
    );
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "render island in island",

  async fn(_t) {
    await withPageName(
      "./tests/fixture_island_nesting/main.ts",
      async (page, address) => {
        await page.goto(`${address}/island_in_island`, {
          waitUntil: "networkidle2",
        });
        await page.waitForSelector(".island");

        await delay(100);
        const text = await page.$eval(
          ".island .island p",
          (el) => el.textContent,
        );
        assertEquals(text, "it works");
      },
    );
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "render island inside island definition",

  async fn(_t) {
    await withPageName(
      "./tests/fixture_island_nesting/main.ts",
      async (page, address) => {
        await page.goto(`${address}/island_in_island_definition`, {
          waitUntil: "networkidle2",
        });
        await page.waitForSelector(".island");

        await delay(100);
        const text = await page.$eval(
          ".island .island p",
          (el) => el.textContent,
        );
        assertEquals(text, "it works");

        // Check that there is no duplicated content which could happen
        // when islands aren't initialized correctly
        const pageText = await page.$eval("#page", (el) => el.textContent);
        assertEquals(pageText, "it works");
      },
    );
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name:
    "render island with JSX children that render another island with JSX children",

  async fn(_t) {
    await withPageName(
      "./tests/fixture_island_nesting/main.ts",
      async (page, address) => {
        await page.goto(`${address}/island_jsx_island_jsx`, {
          waitUntil: "networkidle2",
        });
        await page.waitForSelector(".island");

        await delay(100);
        const text = await page.$eval(
          ".island .server .island .server p",
          (el) => el.textContent,
        );
        assertEquals(text, "it works");
      },
    );
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "render sibling islands",

  async fn(_t) {
    await withPageName(
      "./tests/fixture_island_nesting/main.ts",
      async (page, address) => {
        await page.goto(`${address}/island_siblings`, {
          waitUntil: "networkidle2",
        });
        await page.waitForSelector(".island");

        await delay(100);
        const text = await page.$eval(
          ".island .a",
          (el) => el.textContent,
        );
        assertEquals(text, "it works");

        const text2 = await page.$eval(
          ".island + .island .b",
          (el) => el.textContent,
        );
        assertEquals(text2, "it works");
      },
    );
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "render sibling islands that render nothing initially",

  async fn(_t) {
    await withPageName(
      "./tests/fixture_island_nesting/main.ts",
      async (page, address) => {
        await page.goto(`${address}/island_conditional`, {
          waitUntil: "networkidle2",
        });
        await page.waitForSelector("button");

        await delay(100);
        await page.click("button");

        const text = await page.$eval(
          "#page",
          (el) => el.textContent,
        );
        // Button text is matched too, but this allows us
        // to assert correct ordering. The "it works" should
        // be left of "Toggle"
        assertEquals(text, "it worksToggle");
      },
    );
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "serialize inner island props",

  async fn(_t) {
    await withPageName(
      "./tests/fixture_island_nesting/main.ts",
      async (page, address) => {
        await page.goto(`${address}/island_nested_props`, {
          waitUntil: "networkidle2",
        });
        await page.waitForSelector(".island");

        await delay(100);
        const text = await page.$eval(
          ".island .island p",
          (el) => el.textContent,
        );
        assertEquals(text, "it works");
      },
    );
  },

  sanitizeOps: false,
  sanitizeResources: false,
});
