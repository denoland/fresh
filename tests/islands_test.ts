import { assert, assertEquals, assertStringIncludes, Page } from "./deps.ts";
import {
  assertNoPageComments,
  assertNotSelector,
  clickWhenListenerReady,
  getErrorOverlay,
  parseHtml,
  waitForText,
  withFakeServe,
  withPageName,
} from "./test_utils.ts";

Deno.test("island tests", async (t) => {
  await withPage(async (page, address) => {
    async function counterTest(counterId: string, originalValue: number) {
      const pElem = await page.waitForSelector(`#${counterId} > p`);

      const value = await pElem?.evaluate((el) => el.textContent);
      assert(value === `${originalValue}`, `${counterId} first value`);

      await clickWhenListenerReady(page, `#b-${counterId}`);
      await waitForText(page, `#${counterId} > p`, String(originalValue + 1));
    }

    await page.goto(`${address}/islands`);

    await t.step("Ensure 5 islands on 1 page are revived", async () => {
      await counterTest("counter1", 3);
      await counterTest("counter2", 10);
      await counterTest("folder-counter", 3);
      await counterTest("subfolder-counter", 3);
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
});

Deno.test("multiple islands exported from one file", async (t) => {
  await withPage(async (page, address) => {
    async function counterTest(counterId: string, originalValue: number) {
      const pElem = await page.waitForSelector(`#${counterId} > p`);

      const value = await pElem?.evaluate((el) => el.textContent);
      assert(value === `${originalValue}`, `${counterId} first value`);

      await clickWhenListenerReady(page, `#b-${counterId}`);
      await waitForText(page, `#${counterId} > p`, String(originalValue + 1));
    }

    await page.goto(`${address}/islands/multiple_island_exports`);

    await t.step("Ensure 3 islands on 1 page are revived", async () => {
      await counterTest("counter0", 4);
      await counterTest("counter1", 3);
      await counterTest("counter2", 10);
    });
  });
});

function withPage(fn: (page: Page, address: string) => Promise<void>) {
  return withPageName("./tests/fixture/main.ts", fn);
}

Deno.test("island tests with </script>", async (t) => {
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
});

Deno.test("island with json import", async () => {
  await withPage(async (page, address) => {
    await page.goto(`${address}/island_json`, {
      waitUntil: "networkidle2",
    });

    const json = await page.$eval("pre", (el) => el.textContent);
    assertEquals(JSON.parse(json), { foo: "it works" });
  });
});

Deno.test("island with fragment as root", async () => {
  await withPage(async (page, address) => {
    await page.goto(`${address}/islands/root_fragment`);

    const clickableSelector = "#root-fragment-click-me";

    await page.waitForSelector(clickableSelector);

    await waitForText(page, `#island-parent`, "HelloWorld");

    await clickWhenListenerReady(page, clickableSelector);
    await waitForText(page, `#island-parent`, "HelloWorldI'm rendered now");
  });
});

Deno.test(
  "island with fragment as root and conditional child first",
  async () => {
    await withPage(async (page, address) => {
      await page.goto(
        `${address}/islands/root_fragment_conditional_first`,
      );

      const clickableSelector = "#root-fragment-conditional-first-click-me";
      await page.waitForSelector(clickableSelector);

      await waitForText(page, "#island-parent", "HelloWorld");

      await clickWhenListenerReady(page, clickableSelector);
      await waitForText(
        page,
        "#island-parent",
        "I'm rendered on topHelloWorld",
      );
    });
  },
);

Deno.test("island that returns `null`", async () => {
  await withPage(async (page, address) => {
    await page.goto(`${address}/islands/returning_null`);
    await page.waitForSelector(".added-by-use-effect");
  });
});

Deno.test("island using `npm:` specifiers", async () => {
  await withPageName("./tests/fixture_npm/main.ts", async (page, address) => {
    await page.setJavaScriptEnabled(false);
    await page.goto(address);
    await page.waitForSelector("#server-true");

    await page.setJavaScriptEnabled(true);
    await page.reload();
    await page.waitForSelector("#browser-true");
  });
});

Deno.test("pass single JSX child to island", async () => {
  await withPageName(
    "./tests/fixture_island_nesting/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_jsx_child`);
      await page.waitForSelector(".island");
      await waitForText(page, ".island", "it works");
      await assertNoPageComments(page);
    },
  );
});

Deno.test("pass multiple JSX children to island", async () => {
  await withPageName(
    "./tests/fixture_island_nesting/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_jsx_children`);
      await page.waitForSelector(".island");

      await waitForText(page, ".island", "it works");
      await assertNoPageComments(page);
    },
  );
});

Deno.test("pass multiple text JSX children to island", async () => {
  await withPageName(
    "./tests/fixture_island_nesting/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_jsx_text`);
      await page.waitForSelector(".island");

      await waitForText(page, ".island", "it works");
      await assertNoPageComments(page);
    },
  );
});

Deno.test("render island in island", async () => {
  await withPageName(
    "./tests/fixture_island_nesting/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_in_island`);
      await page.waitForSelector(".island");
      await waitForText(page, ".island .island p", "it works");
      await assertNoPageComments(page);
    },
  );
});

Deno.test("render island inside island definition", async () => {
  await withPageName(
    "./tests/fixture_island_nesting/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_in_island_definition`);
      await page.waitForSelector(".island");

      await waitForText(page, ".island .island p", "it works");

      // Check that there is no duplicated content which could happen
      // when islands aren't initialized correctly
      await waitForText(page, "#page", "it works");
      await assertNoPageComments(page);
    },
  );
});

Deno.test("render island inside island with conditional children", async () => {
  await withPageName(
    "./tests/fixture_island_nesting/main.ts",
    async (page, address) => {
      await page.goto(`${address}/dropdown`);
      await page.waitForSelector("button");
      await assertNoPageComments(page);

      const doc = parseHtml(await page.content());
      assertNotSelector(doc, ".result");

      await page.click("button");
      await page.waitForSelector(".result");
      await assertNoPageComments(page);
    },
  );
});

Deno.test(
  "render island with JSX children that render another island with JSX children",
  async () => {
    await withPageName(
      "./tests/fixture_island_nesting/main.ts",
      async (page, address) => {
        await page.goto(`${address}/island_jsx_island_jsx`);
        await page.waitForSelector(".island");

        await waitForText(
          page,
          ".island .server .island .server p",
          "it works",
        );

        await assertNoPageComments(page);
      },
    );
  },
);

Deno.test("render sibling islands", async () => {
  await withPageName(
    "./tests/fixture_island_nesting/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_siblings`);
      await page.waitForSelector(".island");

      await waitForText(page, ".island .a", "it works");
      await waitForText(page, ".island + .island .b", "it works");
      await assertNoPageComments(page);
    },
  );
});

Deno.test("render sibling islands that render nothing initially", async () => {
  await withPageName(
    "./tests/fixture_island_nesting/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_conditional`);
      await page.waitForSelector(".island");
      await assertNoPageComments(page);

      await page.click("button");

      // Button text is matched too, but this allows us
      // to assert correct ordering. The "island content" should
      // be left of "Toggle"
      await waitForText(page, "#page", "island contentToggle");
      await assertNoPageComments(page);
    },
  );
});

Deno.test("serialize inner island props", async () => {
  await withPageName(
    "./tests/fixture_island_nesting/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_nested_props`);
      await page.waitForSelector(".island");

      await waitForText(page, ".island .island p", "it works");
      await assertNoPageComments(page);
    },
  );
});

Deno.test("render island inside island when passed as fn child", async () => {
  await withPageName(
    "./tests/fixture_island_nesting/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_fn_child`);
      await page.waitForSelector(".island");
      await waitForText(page, "#page", "it works");
      await assertNoPageComments(page);
    },
  );
});

Deno.test("render nested islands in correct order", async () => {
  await withPageName(
    "./tests/fixture_island_nesting/main.ts",
    async (page, address) => {
      await page.goto(`${address}/island_order`);
      await page.waitForSelector(".island");
      await waitForText(page, "#page", "leftcenterright");
      await assertNoPageComments(page);
    },
  );
});

Deno.test({
  name: "render nested islands with server children conditionally",

  async fn() {
    await withPageName(
      "./tests/fixture_island_nesting/main.ts",
      async (page, address) => {
        await page.goto(`${address}/island_conditional_lazy`);
        await waitForText(page, ".island p", "island content");
        await assertNoPageComments(page);

        await page.click("button");
        await waitForText(page, ".island p", "server rendered");
        await assertNoPageComments(page);
      },
    );
  },
});

Deno.test(
  "revive island in lazy server rendered children conditionally",
  async () => {
    await withPageName(
      "./tests/fixture_island_nesting/main.ts",
      async (page, address) => {
        await page.goto(`${address}/island_conditional_lazy_island`);
        await waitForText(page, ".island p", "island content");
        await page.waitForSelector(".mounted");
        await assertNoPageComments(page);

        await page.click("button");
        await waitForText(page, ".island .server", "server rendered");
        await assertNoPageComments(page);

        await page.click("button.counter");
        await waitForText(page, ".island .count", "1");
        await assertNoPageComments(page);
      },
    );
  },
);

Deno.test("revive boolean attributes", async () => {
  await withPageName(
    "./tests/fixture/main.ts",
    async (page, address) => {
      await page.goto(`${address}/preact/boolean_attrs`);
      await waitForText(page, ".form-revived", "Revived: true");
      await assertNoPageComments(page);

      const checked = await page.$eval(
        "input[type=checkbox]",
        (el) => el.checked,
      );
      assertEquals(checked, true, "Checkbox is not checked");

      const required = await page.$eval(
        "input[type=text]",
        (el) => el.required,
      );
      assertEquals(required, true, "Text input is not marked as required");

      const radioChecked = await page.$eval(
        "input[type=radio][value='2']",
        (el) => el.checked,
      );
      assertEquals(
        radioChecked,
        true,
        "Text input is not marked as required",
      );

      const selected = await page.$eval(
        "select",
        (el) => el.options[el.selectedIndex].text,
      );
      assertEquals(selected, "bar", "'bar' value is not selected");
    },
  );
});

Deno.test("throws when passing non-jsx children to an island", async (t) => {
  await withFakeServe(
    "./tests/fixture_island_nesting/dev.ts",
    async (server) => {
      const overlay1 = await getErrorOverlay(
        server,
        "/island_invalid_children",
      );
      assertStringIncludes(
        overlay1.title,
        "Invalid JSX child passed to island",
      );

      const overlay2 = await getErrorOverlay(
        server,
        "/island_invalid_children_fn",
      );
      assertStringIncludes(
        overlay2.title,
        "Invalid JSX child passed to island",
      );

      await t.step("should not throw on valid children", async () => {
        const doc2 = await server.getHtml(`/island_valid_children`);

        assertNotSelector(doc2, "#fresh-error-overlay");
      });
    },
  );
});

Deno.test("serves multiple islands in one file", async () => {
  await withPageName(
    "./tests/fixture_islands_multiple/dev.ts",
    async (page, address) => {
      await page.goto(address, { waitUntil: "networkidle2" });

      await page.click(".single button");
      await waitForText(page, ".single p", "Single Island: 1");

      await page.click(".multiple1 button");
      await waitForText(page, ".multiple1 p", "Multiple1 Island: 1");
      await page.click(".multiple2 button");
      await waitForText(page, ".multiple2 p", "Multiple2 Island: 1");

      await page.click(".multipledefault button");
      await waitForText(
        page,
        ".multipledefault p",
        "MultipleDefault Island: 1",
      );
      await page.click(".multipledefault1 button");
      await waitForText(
        page,
        ".multipledefault1 p",
        "MultipleDefault1 Island: 1",
      );
      await page.click(".multipledefault2 button");
      await waitForText(
        page,
        ".multipledefault2 p",
        "MultipleDefault2 Island: 1",
      );
    },
  );
});
