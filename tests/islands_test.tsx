import { App, fsRoutes } from "fresh";
import { Counter } from "./fixtures_islands/islands/Counter.tsx";
import { IslandInIsland } from "./fixtures_islands/islands/IslandInIsland.tsx";
import { JsonIsland } from "./fixtures_islands/islands/JsonIsland.tsx";
import { SelfCounter } from "./fixtures_islands/islands/SelfCounter.tsx";
import { CounterWithSlots } from "./fixtures_islands/islands/CounterWithSlots.tsx";
import { PassThrough } from "./fixtures_islands/islands/PassThrough.tsx";
import { NullIsland } from "./fixtures_islands/islands/NullIsland.tsx";
import { Multiple1, Multiple2 } from "./fixtures_islands/islands/Multiple.tsx";
import { JsxIsland } from "./fixtures_islands/islands/JsxIsland.tsx";
import { JsxChildrenIsland } from "./fixtures_islands/islands/JsxChildrenIsland.tsx";
import { NodeProcess } from "./fixtures_islands/islands/NodeProcess.tsx";
import { signal } from "@preact/signals";
import { buildProd, Doc, getIsland, withBrowserApp } from "./test_utils.tsx";
import { parseHtml, waitForText } from "./test_utils.tsx";
import { staticFiles } from "../src/middlewares/static_files.ts";
import { expect } from "@std/expect";
import { JsxConditional } from "./fixtures_islands/islands/JsxConditional.tsx";
import { FnIsland } from "./fixtures_islands/islands/FnIsland.tsx";
import { FragmentIsland } from "./fixtures_islands/islands/FragmentIsland.tsx";
import { EscapeIsland } from "./fixtures_islands/islands/EscapeIsland.tsx";
import * as path from "@std/path";
import { FakeServer } from "../src/test_utils.ts";
import { app } from "./fixtures_islands/main.ts";

await buildProd(app);

Deno.test({
  name: "islands - should make signals interactive",
  fn: async () => {
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/island_interactive`, { waitUntil: "load" });
      await page.locator(".ready").wait();
      await page.locator(".increment").click();
      await waitForText(page, ".output", "4");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - revive multiple islands from one island file",
  fn: async () => {
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/multiple`, { waitUntil: "load" });
      await page.locator("#multiple-1.ready").wait();
      await page.locator("#multiple-2.ready").wait();
      await page.locator("#multiple-1 .increment").click();
      await page.locator("#multiple-2 .increment").click();
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
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/multiple_shared_signal`, {
        waitUntil: "load",
      });
      await page.locator("#counter-1.ready").wait();
      await page.locator("#counter-2.ready").wait();
      await page.locator("#counter-1 .increment").click();
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
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/json`, { waitUntil: "load" });
      await page.locator("pre").wait();
      const text = await page
        .locator<HTMLPreElement>("pre")
        .evaluate((el) => el.textContent!);
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
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/null`, { waitUntil: "load" });
      await page.locator(".ready").wait();
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - only instantiate top level island",
  fn: async () => {
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/island_in_island`, { waitUntil: "load" });
      await page.locator(".ready").wait();
      await page.locator(".trigger").click();
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
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/jsx`, { waitUntil: "load" });
      await page.locator(".ready").wait();

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
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/jsx_props`, { waitUntil: "load" });
      await page.locator(".ready").wait();

      const text = await page
        .locator<HTMLPreElement>("pre")
        .evaluate((el) => el.textContent!);
      expect(JSON.parse(text)).toEqual({ jsx: true, children: true });
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - never serialize children prop",
  fn: async () => {
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/jsx_children_prop`, { waitUntil: "load" });
      await page.locator(".ready").wait();

      const text = await page
        .locator<HTMLScriptElement>("script")
        .evaluate((el) => el.textContent!);
      expect(text).not.toContain("foobar");

      const childText = await page
        .locator<HTMLDivElement>(".after")
        .evaluate((el) => el.textContent!);
      expect(childText).toEqual("foobar");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - instantiate islands in jsx children",
  fn: async () => {
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/jsx_children_island`, { waitUntil: "load" });
      await page.locator(".ready").wait();

      await page.locator(".increment").click();
      await waitForText(page, ".output", "1");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - instantiate islands in jsx children with slots",
  fn: async () => {
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/jsx_children_island_slots`, {
        waitUntil: "load",
      });
      await page.locator(".ready").wait();

      await page.locator(".jsx .increment").click();
      await page.locator(".children .increment").click();
      await page.locator(".counter-with-children button").click();

      await waitForText(page, ".counter-with-children .output", "1");
      await waitForText(page, ".jsx .output", "1");
      await waitForText(page, ".children .output", "1");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - nested children slots",
  fn: async () => {
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/jsx_nested_children_slots`, {
        waitUntil: "load",
      });
      await page.locator(".ready").wait();

      await page.locator("#a .increment").click();
      await page.locator("#b .increment").click();

      await waitForText(page, "#a .output", "1");
      await waitForText(page, "#b .output", "1");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - conditional jsx children",
  fn: async () => {
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/jsx_conditional_children`, {
        waitUntil: "load",
      });
      await page.locator(".ready").wait();

      await page.locator(".jsx .increment").click();
      await page.locator(".children .increment").click();
      await page.locator(".cond-update").click();

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
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/revive_dom_attributes`, {
        waitUntil: "load",
      });
      await page.locator(".ready").wait();

      await page.locator(".children > .foo").wait();

      const checkboxChecked = await page
        .locator<HTMLInputElement>("input[name='check']")
        .evaluate((el) => el.checked);
      expect(checkboxChecked).toEqual(true);

      const required = await page
        .locator<HTMLInputElement>("input[name='text']")
        .evaluate((el) => el.required);
      expect(required).toEqual(true);

      const radio1 = await page
        .locator<HTMLInputElement>("input[type='radio'][value='1']")
        .evaluate((el) => el.checked);
      expect(radio1).toEqual(false);

      const radio2 = await page
        .locator<HTMLInputElement>("input[type='radio'][value='2']")
        .evaluate((el) => el.checked);
      expect(radio2).toEqual(true);
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - revive island with fn inside",
  fn: async () => {
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/fn_island`, { waitUntil: "load" });
      await page.locator(".ready").wait();

      const text = await page
        .locator<HTMLDivElement>(".ready")
        .evaluate((el) => el.textContent!);
      expect(text).toEqual("it works");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - escape props",
  fn: async () => {
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/escape`, { waitUntil: "load" });
      await page.locator(".ready").wait();

      // Page would error here
      const text = await page
        .locator<HTMLDivElement>(".ready")
        .evaluate((el) => el.textContent!);
      expect(text).toEqual("it works");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - stub Node 'process.env'",
  fn: async () => {
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/node_process`, { waitUntil: "load" });
      await page.locator(".ready").wait();

      // Page would error here
      const text = await page
        .locator<HTMLDivElement>(".ready")
        .evaluate((el) => el.textContent!);
      expect(text).toEqual("value: production");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - in base path",
  fn: async () => {
    const selfCounter = getIsland("SelfCounter.tsx");

    const app = testApp({ basePath: "/foo" })
      .use(staticFiles())
      .island(selfCounter, "SelfCounter", SelfCounter)
      .get("/", (ctx) =>
        ctx.render(
          <Doc>
            <SelfCounter />
          </Doc>,
        ));

    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/foo`, { waitUntil: "load" });
      await page.locator(".ready").wait();

      await page.locator(".increment").click();
      await waitForText(page, ".output", "1");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - preserve f-* attributes",
  fn: async () => {
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/fresh_attrs`, { waitUntil: "load" });
      await page.locator(".ready").wait();

      const truthy = await page.locator<HTMLDivElement>(".f-client-nav-true")
        .evaluate((el) => el.getAttribute("f-client-nav"));
      const falsy = await page.locator<HTMLDivElement>(".f-client-nav-false")
        .evaluate((el) => el.getAttribute("f-client-nav"));

      expect(truthy).toEqual("true");
      expect(falsy).toEqual("false");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "fsRoutes - load islands from group folder",
  fn: async () => {
    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/island_group_foo`, { waitUntil: "load" });
      await page.locator(".ready").wait();

      // Page would error here
      const text = await page
        .locator<HTMLDivElement>(".ready")
        .evaluate((el) => el.textContent!);
      expect(text).toEqual("it works");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "islands - adds preload HTTP headers",
  fn: async () => {
    const server = new FakeServer(await app.handler());
    const res = await server.get("/island_interactive");
    await res.body?.cancel();

    const link = res.headers.get("Link");
    expect(link).toMatch(
      /<\/fresh-runtime\.js\?__frsh_c=[^>]+>; rel="modulepreload"; as="script", <\/Counter\.js\?__frsh_c=[^>]+>; rel="modulepreload"; as="script"/,
    );
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
