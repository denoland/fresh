import { App } from "@fresh/core";
import { Counter } from "./fixtures_islands/Counter.tsx";
import { IslandInIsland } from "./fixtures_islands/IslandInIsland.tsx";
import { JsonIsland } from "./fixtures_islands/JsonIsland.tsx";
import { SelfCounter } from "./fixtures_islands/SelfCounter.tsx";
import { CounterWithSlots } from "./fixtures_islands/CounterWithSlots.tsx";
import { PassThrough } from "./fixtures_islands/PassThrough.tsx";
import { NullIsland } from "./fixtures_islands/NullIsland.tsx";
import { Multiple1, Multiple2 } from "./fixtures_islands/Multiple.tsx";
import { JsxIsland } from "./fixtures_islands/JsxIsland.tsx";
import { JsxChildrenIsland } from "./fixtures_islands/JsxChildrenIsland.tsx";
import { signal } from "@preact/signals";
import { Doc, getIsland, withBrowserApp } from "./test_utils.tsx";
import { parseHtml, waitForText } from "./test_utils.tsx";
import { staticFiles } from "../src/middlewares/static_files.ts";
import { expect } from "@std/expect";
import { JsxConditional } from "./fixtures_islands/JsxConditional.tsx";
import { FnIsland } from "./fixtures_islands/FnIsland.tsx";
import { FragmentIsland } from "./fixtures_islands/FragmentIsland.tsx";

Deno.test("islands - should make signals interactive", async () => {
  const counterIsland = getIsland("Counter.tsx");

  const app = new App()
    .use(staticFiles())
    .island(counterIsland, "Counter", Counter)
    .get("/", (ctx) => {
      const sig = signal(3);
      return ctx.render(
        <Doc>
          <Counter count={sig} />
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");
    await page.click(".increment");
    await waitForText(page, ".output", "4");
  });
});

Deno.test(
  "islands - revive multiple islands from one island file",
  async () => {
    const multipleIslands = getIsland("Multiple.tsx");

    const app = new App()
      .use(staticFiles())
      .island(multipleIslands, "Multiple1", Multiple1)
      .island(multipleIslands, "Multiple2", Multiple2)
      .get("/", (ctx) => {
        return ctx.render(
          <Doc>
            <Multiple1 id="multiple-1" />
            <Multiple2 id="multiple-2" />
          </Doc>,
        );
      });

    await withBrowserApp(app, async (page, address) => {
      await page.goto(address);
      await page.waitForSelector("#multiple-1.ready");
      await page.waitForSelector("#multiple-2.ready");
      await page.click("#multiple-1 .increment");
      await page.click("#multiple-2 .increment");
      await waitForText(page, "#multiple-1 .output", "1");
      await waitForText(page, "#multiple-2 .output", "1");
    });
  },
);

Deno.test(
  "islands - revive multiple islands with shared signal",
  async () => {
    const counterIsland = getIsland("Counter.tsx");

    const app = new App()
      .use(staticFiles())
      .island(counterIsland, "Counter", Counter)
      .get("/", (ctx) => {
        const sig = signal(0);
        return ctx.render(
          <Doc>
            <Counter id="counter-1" count={sig} />
            <Counter id="counter-2" count={sig} />
          </Doc>,
        );
      });

    await withBrowserApp(app, async (page, address) => {
      await page.goto(address);
      await page.waitForSelector("#counter-1.ready");
      await page.waitForSelector("#counter-2.ready");
      await page.click("#counter-1 .increment");
      await waitForText(page, "#counter-1 .output", "1");
      await waitForText(page, "#counter-2 .output", "1");
    });
  },
);

Deno.test("islands - import json", async () => {
  const jsonIsland = getIsland("JsonIsland.tsx");

  const app = new App()
    .use(staticFiles())
    .island(jsonIsland, "JsonIsland", Counter)
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <JsonIsland />
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector("pre");
    const text = await page.$eval("pre", (el) => el.textContent);
    const json = JSON.parse(text);
    expect(json).toEqual({ foo: 123 });
  });
});

Deno.test("islands - returns null", async () => {
  const nullIsland = getIsland("NullIsland.tsx");

  const app = new App()
    .use(staticFiles())
    .island(nullIsland, "NullIsland", NullIsland)
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <NullIsland />
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");
  });
});

Deno.test("islands - only instantiate top level island", async () => {
  const counter = getIsland("Counter.tsx");
  const islandInIsland = getIsland("IslandInIsland.tsx");

  const app = new App()
    .use(staticFiles())
    .island(counter, "Counter", Counter)
    .island(islandInIsland, "IslandInIsland", IslandInIsland)
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <IslandInIsland />
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");
    await page.click(".trigger");
    await waitForText(page, ".output", "1");

    const html = await page.content();
    expect(html).not.toContain("import { Counter }");
  });
});

Deno.test("islands - pass null JSX props to islands", async () => {
  const jsxIsland = getIsland("JsxIsland.tsx");

  const app = new App()
    .use(staticFiles())
    .island(jsxIsland, "JsxIsland", JsxIsland)
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <JsxIsland jsx={null}>{null}</JsxIsland>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");

    const html = await page.content();
    const doc = parseHtml(html);
    expect(doc.querySelector(".jsx")!.childNodes.length).toEqual(0);
    expect(doc.querySelector(".children")!.childNodes.length).toEqual(0);
  });
});

Deno.test("islands - pass JSX props to islands", async () => {
  const jsxIsland = getIsland("JsxIsland.tsx");

  const app = new App()
    .use(staticFiles())
    .island(jsxIsland, "JsxIsland", JsxIsland)
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <JsxIsland jsx={<p>foo</p>}>
            <p>bar</p>
          </JsxIsland>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");

    const text = await page.$eval("pre", (el) => el.textContent);
    expect(JSON.parse(text)).toEqual({ jsx: true, children: true });
  });
});

Deno.test("islands - never serialize children prop", async () => {
  const jsxChildrenIsland = getIsland("JsxChildrenIsland.tsx");

  const app = new App()
    .use(staticFiles())
    .island(jsxChildrenIsland, "JsxChildrenIsland", JsxChildrenIsland)
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <JsxChildrenIsland>
            foobar
          </JsxChildrenIsland>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");

    const text = await page.$eval("script", (el) => el.textContent);
    expect(text).not.toContain("foobar");

    const childText = await page.$eval(".after", (el) => el.textContent);
    expect(childText).toEqual("foobar");
  });
});

Deno.test("islands - instantiate islands in jsx children", async () => {
  const passThrough = getIsland("PassThrough.tsx");
  const selfCounter = getIsland("SelfCounter.tsx");

  const app = new App()
    .use(staticFiles())
    .island(passThrough, "PassThrough", PassThrough)
    .island(selfCounter, "SelfCounter", SelfCounter)
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <PassThrough>
            <div>
              <SelfCounter />
            </div>
          </PassThrough>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");

    await page.click(".increment");
    await waitForText(page, ".output", "1");
  });
});

Deno.test(
  "islands - instantiate islands in jsx children with slots",
  async () => {
    const counterWithSlots = getIsland("CounterWithSlots.tsx");
    const selfCounter = getIsland("SelfCounter.tsx");

    const app = new App()
      .use(staticFiles())
      .island(counterWithSlots, "CounterWithSlots", CounterWithSlots)
      .island(selfCounter, "SelfCounter", SelfCounter)
      .get("/", (ctx) => {
        return ctx.render(
          <Doc>
            <CounterWithSlots
              jsx={
                <div>
                  <SelfCounter />
                </div>
              }
            >
              <div>
                <SelfCounter />
              </div>
            </CounterWithSlots>
          </Doc>,
        );
      });

    await withBrowserApp(app, async (page, address) => {
      await page.goto(address);
      await page.waitForSelector(".ready");

      await page.click(".jsx .increment");
      await page.click(".children .increment");
      await page.click(".counter-with-children button");

      await waitForText(page, ".counter-with-children .output", "1");
      await waitForText(page, ".jsx .output", "1");
      await waitForText(page, ".children .output", "1");
    });
  },
);

Deno.test(
  "islands - conditional jsx children",
  async () => {
    const jsxConditional = getIsland("JsxConditional.tsx");
    const selfCounter = getIsland("SelfCounter.tsx");

    const app = new App()
      .use(staticFiles())
      .island(jsxConditional, "JsxConditional", JsxConditional)
      .island(selfCounter, "SelfCounter", SelfCounter)
      .get("/", (ctx) => {
        return ctx.render(
          <Doc>
            <JsxConditional
              jsx={
                <div>
                  <SelfCounter />
                </div>
              }
            >
              <div>
                <SelfCounter />
              </div>
            </JsxConditional>
          </Doc>,
        );
      });

    await withBrowserApp(app, async (page, address) => {
      await page.goto(address);
      await page.waitForSelector(".ready");

      await page.click(".jsx .increment");
      await page.click(".children .increment");
      await page.click(".cond-update");

      await waitForText(page, ".cond-output", "1");
      await waitForText(page, ".jsx .output", "1");
      await waitForText(page, ".children .output", "1");
    });
  },
);

Deno.test("islands - revive DOM attributes", async () => {
  const jsxConditional = getIsland("JsxConditional.tsx");

  const app = new App()
    .use(staticFiles())
    .island(jsxConditional, "JsxConditional", JsxConditional)
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <JsxConditional>
            <div class="foo">
              <form>
                <label for="check">
                  checked
                </label>
                <input name="check" type="checkbox" checked />
                <label for="text">
                  is required
                </label>
                <input name="text" type="text" required />
                <label for="foo-1">
                  not selected
                </label>
                <input id="foo-1" type="radio" name="foo" value="1" />
                <label for="foo-2">
                  selected
                </label>
                <input id="foo-2" type="radio" name="foo" value="2" checked />
                <label for="select">
                  select value should be "bar"
                </label>
                <select name="select">
                  <option value="foo">foo</option>
                  <option value="bar" selected>bar</option>
                </select>
              </form>
              <SelfCounter />
            </div>
          </JsxConditional>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");

    await page.waitForSelector(".children > .foo");

    const checkboxChecked = await page.$eval(
      "input[name='check']",
      (el) => el.checked,
    );
    expect(checkboxChecked).toEqual(true);

    const required = await page.$eval(
      "input[name='text']",
      (el) => el.required,
    );
    expect(required).toEqual(true);

    const radio1 = await page.$eval(
      "input[type='radio'][value='1']",
      (el) => el.checked,
    );
    expect(radio1).toEqual(false);
    const radio2 = await page.$eval(
      "input[type='radio'][value='2']",
      (el) => el.checked,
    );
    expect(radio2).toEqual(true);
  });
});

Deno.test("islands - revive island with fn inside", async () => {
  const fragmentIsland = getIsland("FragmentIsland.tsx");
  const fnIsland = getIsland("FnIsland.tsx");

  const app = new App()
    .use(staticFiles())
    .island(fragmentIsland, "FragmentIsland", FragmentIsland)
    .island(fnIsland, "FnIsland", FnIsland)
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <FnIsland />
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");

    const text = await page.$eval(".ready", (el) => el.textContent);
    expect(text).toEqual("it works");
  });
});
