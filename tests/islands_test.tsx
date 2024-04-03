import { FreshApp } from "@fresh/core";
import type { ComponentChildren } from "preact";
import * as path from "@std/path";
import { Counter } from "./fixtures_islands/Counter.tsx";
import { IslandInIsland } from "./fixtures_islands/IslandInIsland.tsx";
import { JsonIsland } from "./fixtures_islands/JsonIsland.tsx";
import { NullIsland } from "./fixtures_islands/NullIsland.tsx";
import { Multiple1, Multiple2 } from "./fixtures_islands/Multiple.tsx";
import { JsxIsland } from "./fixtures_islands/JsxIsland.tsx";
import { JsxChildrenIsland } from "./fixtures_islands/JsxChildrenIsland.tsx";
import { signal } from "@preact/signals";
import { withBrowserApp } from "./test_utils.ts";
import { FreshScripts } from "../src/runtime/server/preact_hooks.tsx";
import { parseHtml, waitForText } from "./test_utils.ts";
import { freshStaticFiles } from "../src/middlewares/static_files.ts";
import { expect } from "@std/expect";

function Doc(props: { children?: ComponentChildren }) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Test</title>
      </head>
      <body>
        {props.children}
        <FreshScripts />
      </body>
    </html>
  );
}

function getIsland(pathname: string) {
  return path.join(
    import.meta.dirname!,
    "fixtures_islands",
    pathname,
  );
}

Deno.test("islands - should make signals interactive", async () => {
  const counterIsland = getIsland("Counter.tsx");

  const app = new FreshApp()
    .use(freshStaticFiles())
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

    const app = new FreshApp()
      .use(freshStaticFiles())
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

    const app = new FreshApp()
      .use(freshStaticFiles())
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

  const app = new FreshApp()
    .use(freshStaticFiles())
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

  const app = new FreshApp()
    .use(freshStaticFiles())
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

  const app = new FreshApp()
    .use(freshStaticFiles())
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

  const app = new FreshApp()
    .use(freshStaticFiles())
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

  const app = new FreshApp()
    .use(freshStaticFiles())
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

  const app = new FreshApp()
    .use(freshStaticFiles())
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
