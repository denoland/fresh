import { App, fsRoutes } from "@fresh/core";
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
import { EscapeIsland } from "./fixtures_islands/EscapeIsland.tsx";
import * as path from "@std/path";

Deno.test({
  name: "islands - should make signals interactive",
  fn: async () => {
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
      await page.goto(address, { waitUntil: "load" });
      await page.waitForSelector(".ready");
      await (await page.$(".increment"))!.click();
      await waitForText(page, ".output", "4");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - revive multiple islands from one island file",
  fn: async () => {
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
      await page.goto(address, { waitUntil: "load" });
      await page.waitForSelector("#multiple-1.ready");
      await page.waitForSelector("#multiple-2.ready");
      await (await page.$("#multiple-1 .increment"))!.click();
      await (await page.$("#multiple-2 .increment"))!.click();
      await waitForText(page, "#multiple-1 .output", "1");
      await waitForText(page, "#multiple-2 .output", "1");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - revive multiple islands with shared signal",
  fn: async () => {
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
      await page.goto(address, { waitUntil: "load" });
      await page.waitForSelector("#counter-1.ready");
      await page.waitForSelector("#counter-2.ready");
      await (await page.$("#counter-1 .increment"))!.click();
      await waitForText(page, "#counter-1 .output", "1");
      await waitForText(page, "#counter-2 .output", "1");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - import json",
  fn: async () => {
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
      await page.goto(address, { waitUntil: "load" });
      await page.waitForSelector("pre");
      const text = await (await page.$("pre"))!.evaluate((el: HTMLPreElement) =>
        el.textContent!
      );
      const json = JSON.parse(text);
      expect(json).toEqual({ foo: 123 });
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - returns null",
  fn: async () => {
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
      await page.goto(address, { waitUntil: "load" });
      await page.waitForSelector(".ready");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - only instantiate top level island",
  fn: async () => {
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
      await page.goto(address, { waitUntil: "load" });
      await page.waitForSelector(".ready");
      await (await page.$(".trigger"))!.click();
      await waitForText(page, ".output", "1");

      const html = await page.content();
      expect(html).not.toContain("import { Counter }");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - pass null JSX props to islands",
  fn: async () => {
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
      await page.goto(address, { waitUntil: "load" });
      await page.waitForSelector(".ready");

      const html = await page.content();
      const doc = parseHtml(html);
      expect(doc.querySelector(".jsx")!.childNodes.length).toEqual(0);
      expect(doc.querySelector(".children")!.childNodes.length).toEqual(0);
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - pass JSX props to islands",
  fn: async () => {
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
      await page.goto(address, { waitUntil: "load" });
      await page.waitForSelector(".ready");

      const text = await (await page.$("pre"))!.evaluate((el: HTMLPreElement) =>
        el.textContent!
      );
      expect(JSON.parse(text)).toEqual({ jsx: true, children: true });
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - never serialize children prop",
  fn: async () => {
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
      await page.goto(address, { waitUntil: "load" });
      await page.waitForSelector(".ready");

      const text = await (await page.$("script"))!.evaluate((
        el: HTMLScriptElement,
      ) => el.textContent!);
      expect(text).not.toContain("foobar");

      const childText = await (await page.$(".after"))!.evaluate((
        el: HTMLDivElement,
      ) => el.textContent!);
      expect(childText).toEqual("foobar");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - instantiate islands in jsx children",
  fn: async () => {
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
      await page.goto(address, { waitUntil: "load" });
      await page.waitForSelector(".ready");

      await (await page.$(".increment"))!.click();
      await waitForText(page, ".output", "1");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - instantiate islands in jsx children with slots",
  fn: async () => {
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
      await page.goto(address, { waitUntil: "load" });
      await page.waitForSelector(".ready");

      await (await page.$(".jsx .increment"))!.click();
      await (await page.$(".children .increment"))!.click();
      await (await page.$(".counter-with-children button"))!.click();

      await waitForText(page, ".counter-with-children .output", "1");
      await waitForText(page, ".jsx .output", "1");
      await waitForText(page, ".children .output", "1");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - conditional jsx children",
  fn: async () => {
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
      await page.goto(address, { waitUntil: "load" });
      await page.waitForSelector(".ready");

      await (await page.$(".jsx .increment"))!.click();
      await (await page.$(".children .increment"))!.click();
      await (await page.$(".cond-update"))!.click();

      await waitForText(page, ".cond-output", "1");
      await waitForText(page, ".jsx .output", "1");
      await waitForText(page, ".children .output", "1");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - revive DOM attributes",
  fn: async () => {
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
      await page.goto(address, { waitUntil: "load" });
      await page.waitForSelector(".ready");

      await page.waitForSelector(".children > .foo");

      const checkboxChecked = await (await page.$(
        "input[name='check']",
      ))!.evaluate(
        (el: HTMLInputElement) => el.checked,
      );
      expect(checkboxChecked).toEqual(true);

      const required = await (await page.$(
        "input[name='text']",
      ))!.evaluate(
        (el: HTMLInputElement) => el.required,
      );
      expect(required).toEqual(true);

      const radio1 = await (await page.$(
        "input[type='radio'][value='1']",
      ))!.evaluate(
        (el: HTMLInputElement) => el.checked,
      );
      expect(radio1).toEqual(false);
      const radio2 = await (await page.$(
        "input[type='radio'][value='2']",
      ))!.evaluate(
        (el: HTMLInputElement) => el.checked,
      );
      expect(radio2).toEqual(true);
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - revive island with fn inside",
  fn: async () => {
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
      await page.goto(address, { waitUntil: "load" });
      await page.waitForSelector(".ready");

      const text = await (await page.$(".ready"))!.evaluate((
        el: HTMLDivElement,
      ) => el.textContent!);
      expect(text).toEqual("it works");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - escape props",
  fn: async () => {
    const escapeIsland = getIsland("EscapeIsland.tsx");

    const app = new App()
      .use(staticFiles())
      .island(escapeIsland, "EscapeIsland", EscapeIsland)
      .get("/", (ctx) => {
        return ctx.render(
          <Doc>
            <EscapeIsland str={`"foo"asdf`} />
          </Doc>,
        );
      });

    await withBrowserApp(app, async (page, address) => {
      await page.goto(address, { waitUntil: "load" });
      await page.waitForSelector(".ready");

      // Page would error here
      const text = await (await page.$(".ready"))!.evaluate((
        el: HTMLDivElement,
      ) => el.textContent!);
      expect(text).toEqual("it works");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "fsRoutes - load islands from group folder",
  fn: async () => {
    const app = new App()
      .use(staticFiles());

    await fsRoutes(app, {
      dir: path.join(
        import.meta.dirname!,
        "fixture_island_groups",
      ),
      loadIsland: (path) => import("./fixture_island_groups/islands/" + path),
      loadRoute: (path) => import("./fixture_island_groups/routes/" + path),
    });

    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/foo`, { waitUntil: "load" });
      await page.waitForSelector(".ready");

      // Page would error here
      const text = await (await page.$(".ready"))!.evaluate((
        el: HTMLDivElement,
      ) => el.textContent!);
      expect(text).toEqual("it works");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
