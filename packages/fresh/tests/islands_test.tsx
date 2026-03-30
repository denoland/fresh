import { App, staticFiles } from "fresh";
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
import { NodeProcess } from "./fixtures_islands/NodeProcess.tsx";
import { signal } from "@preact/signals";
import {
  ALL_ISLAND_DIR,
  buildProd,
  Doc,
  ISLAND_GROUP_DIR,
  withBrowserApp,
} from "./test_utils.tsx";
import { parseHtml, waitForText } from "./test_utils.tsx";
import { expect } from "@std/expect";
import { JsxConditional } from "./fixtures_islands/JsxConditional.tsx";
import { FnIsland } from "./fixtures_islands/FnIsland.tsx";
import { EscapeIsland } from "./fixtures_islands/EscapeIsland.tsx";
import type { FreshConfig } from "../src/config.ts";
import { FreshAttrs } from "./fixtures_islands/FreshAttrs.tsx";
import { FakeServer, integrationTest } from "../src/test_utils.ts";
import { PARTIAL_SEARCH_PARAM } from "../src/constants.ts";
import { ComputedSignal } from "./fixtures_islands/Computed.tsx";
import { EnvIsland } from "./fixtures_islands/EnvIsland.tsx";

Deno.env.set("FRESH_PUBLIC_TEST_FOO", "test-env-value");
Deno.env.set("FRESH_PRIVATE_TEST_FOO", "i-should-not-be-visible");
const allIslandCache = await buildProd({ islandDir: ALL_ISLAND_DIR });
const islandGroupCache = await buildProd({ root: ISLAND_GROUP_DIR });

function testApp(config?: FreshConfig): App<unknown> {
  const app = new App(config)
    .use(staticFiles())
    .fsRoutes();

  allIslandCache(app);

  return app;
}

function testGroupApp(config?: FreshConfig): App<unknown> {
  const app = new App(config)
    .use(staticFiles())
    .fsRoutes();

  islandGroupCache(app);

  return app;
}

integrationTest("islands - should make signals interactive", async () => {
  const app = testApp()
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
    await page.locator(".ready").wait();
    await page.locator(".increment").click();
    await waitForText(page, ".output", "4");
  });
});

integrationTest(
  "islands - revive multiple islands from one island file",
  async () => {
    const app = testApp()
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
      await page.locator("#multiple-1.ready").wait();
      await page.locator("#multiple-2.ready").wait();
      await page.locator("#multiple-1 .increment").click();
      await page.locator("#multiple-2 .increment").click();
      await waitForText(page, "#multiple-1 .output", "1");
      await waitForText(page, "#multiple-2 .output", "1");
    });
  },
);

integrationTest(
  "islands - revive multiple islands with shared signal",
  async () => {
    const app = testApp()
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
      await page.locator("#counter-1.ready").wait();
      await page.locator("#counter-2.ready").wait();
      await page.locator("#counter-1 .increment").click();
      await waitForText(page, "#counter-1 .output", "1");
      await waitForText(page, "#counter-2 .output", "1");
    });
  },
);

integrationTest("islands - should serialize computed", async () => {
  const app = testApp()
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <ComputedSignal id="comp" />
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address, { waitUntil: "load" });
    await page.locator("#comp.ready").wait();
    await page.locator("#comp .trigger").click();
    await waitForText(page, "#comp .output", "it works");
  });
});

integrationTest("islands - import json", async () => {
  const app = testApp()
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <JsonIsland />
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address, { waitUntil: "load" });
    await page.locator("pre").wait();
    const text = await page
      .locator<HTMLPreElement>("pre")
      .evaluate((el) => el.textContent!);
    const json = JSON.parse(text);
    expect(json).toEqual({ foo: 123 });
  });
});

integrationTest("islands - returns null", async () => {
  const app = testApp()
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <NullIsland />
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address, { waitUntil: "load" });
    await page.locator(".ready").wait();
  });
});

integrationTest("islands - only instantiate top level island", async () => {
  const app = testApp()
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <IslandInIsland />
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address, { waitUntil: "load" });
    await page.locator(".ready").wait();
    await page.locator(".trigger").click();
    await waitForText(page, ".output", "1");

    const html = await page.content();
    expect(html).not.toContain("import { Counter }");
  });
});

integrationTest("islands - pass null JSX props to islands", async () => {
  const app = testApp()
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <JsxIsland jsx={null}>{null}</JsxIsland>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address, { waitUntil: "load" });
    await page.locator(".ready").wait();

    const html = await page.content();
    const doc = parseHtml(html);
    expect(doc.querySelector(".jsx")!.childNodes.length).toEqual(0);
    expect(doc.querySelector(".children")!.childNodes.length).toEqual(0);
  });
});

integrationTest("islands - pass JSX props to islands", async () => {
  const app = testApp()
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
    await page.locator(".ready").wait();

    const text = await page
      .locator<HTMLPreElement>("pre")
      .evaluate((el) => el.textContent!);
    expect(JSON.parse(text)).toEqual({ jsx: true, children: true });
  });
});

integrationTest("islands - never serialize children prop", async () => {
  const app = testApp()
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
});

integrationTest("islands - instantiate islands in jsx children", async () => {
  const app = testApp()
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
    await page.locator(".ready").wait();

    await page.locator(".increment").click();
    await waitForText(page, ".output", "1");
  });
});

integrationTest(
  "islands - instantiate islands in jsx children with slots",
  async () => {
    const app = testApp()
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
      await page.locator(".ready").wait();

      await page.locator(".jsx .increment").click();
      await page.locator(".children .increment").click();
      await page.locator(".counter-with-children button").click();

      await waitForText(page, ".counter-with-children .output", "1");
      await waitForText(page, ".jsx .output", "1");
      await waitForText(page, ".children .output", "1");
    });
  },
);

integrationTest("islands - nested children slots", async () => {
  const app = testApp()
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <PassThrough>
            <PassThrough>
              <div>
                <SelfCounter id="a" />
              </div>
            </PassThrough>
            <PassThrough>
              <div>
                <SelfCounter id="b" />
              </div>
            </PassThrough>
          </PassThrough>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address, { waitUntil: "load" });
    await page.locator(".ready").wait();

    await page.locator("#a .increment").click();
    await page.locator("#b .increment").click();

    await waitForText(page, "#a .output", "1");
    await waitForText(page, "#b .output", "1");
  });
});

integrationTest("islands - conditional jsx children", async () => {
  const app = testApp()
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
    await page.locator(".ready").wait();

    await page.locator(".jsx .increment").click();
    await page.locator(".children .increment").click();
    await page.locator(".cond-update").click();

    await waitForText(page, ".cond-output", "1");
    await waitForText(page, ".jsx .output", "1");
    await waitForText(page, ".children .output", "1");
  });
});

integrationTest("islands - revive DOM attributes", async () => {
  const app = testApp()
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
});

integrationTest("islands - revive island with fn inside", async () => {
  const app = testApp()
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <FnIsland />
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address, { waitUntil: "load" });
    await page.locator(".ready").wait();

    const text = await page
      .locator<HTMLDivElement>(".ready")
      .evaluate((el) => el.textContent!);
    expect(text).toEqual("it works");
  });
});

integrationTest("islands - escape props", async () => {
  const app = testApp()
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <EscapeIsland str={`"foo"asdf`} />
        </Doc>,
      );
    })
    .get("/foo", (ctx) => {
      return ctx.render(
        <Doc>
          <EscapeIsland str={`<script>alert('hey')</script>`} />
        </Doc>,
      );
    })
    .get("/bar", (ctx) => {
      return ctx.render(
        <Doc>
          <EscapeIsland str={`<!--<script>alert('hey')</script>`} />
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address, { waitUntil: "load" });
    await page.locator(".ready").wait();

    // Page would error here
    const text = await page
      .locator<HTMLDivElement>(".ready p")
      .evaluate((el) => el.textContent!);
    expect(text).toEqual("it works");

    // Page would error here
    const text2 = await page
      .locator<HTMLDivElement>(".ready div")
      .evaluate((el) => el.textContent!);
    expect(text2).toEqual(`"foo"asdf`);
  });

  // Check escaping of `</`
  await withBrowserApp(app, async (page, address) => {
    await page.goto(`${address}/foo`, { waitUntil: "load" });

    await page.locator(".ready").wait();

    const text = await page
      .locator<HTMLDivElement>(".ready p")
      .evaluate((el) => el.textContent!);
    expect(text).toEqual("it works");

    const text2 = await page
      .locator<HTMLDivElement>(".ready div")
      .evaluate((el) => el.textContent!);
    expect(text2).toEqual(`<script>alert('hey')</script>`);
  });

  // Check escaping of `<!--`
  await withBrowserApp(app, async (page, address) => {
    await page.goto(`${address}/bar`, { waitUntil: "load" });

    await page.locator(".ready").wait();

    const text = await page
      .locator<HTMLDivElement>(".ready p")
      .evaluate((el) => el.textContent!);
    expect(text).toEqual("it works");

    const text2 = await page
      .locator<HTMLDivElement>(".ready div")
      .evaluate((el) => el.textContent!);
    expect(text2).toEqual(`<!--<script>alert('hey')</script>`);
  });

  // Partials (they use a different code path)
  await withBrowserApp(app, async (page, address) => {
    await page.goto(`${address}/foo?${PARTIAL_SEARCH_PARAM}`, {
      waitUntil: "load",
    });

    const text = await page
      .locator<HTMLScriptElement>("script[type='application/json']")
      .evaluate((el) => el.textContent!);

    const json = JSON.parse(text);
    expect(json.props).toContain("<script>alert('hey')</script>");
  });
});

integrationTest("islands - stub Node 'process.env'", async () => {
  const app = testApp()
    .get("/", (ctx) =>
      ctx.render(
        <Doc>
          <NodeProcess />
        </Doc>,
      ));

  await withBrowserApp(app, async (page, address) => {
    await page.goto(`${address}/`, { waitUntil: "load" });
    await page.locator(".ready").wait();

    // Page would error here
    const text = await page
      .locator<HTMLDivElement>(".ready")
      .evaluate((el) => el.textContent!);
    expect(text).toEqual("value: production");
  });
});

integrationTest("islands - in base path", async () => {
  const app = testApp({ basePath: "/foo" })
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
});

integrationTest("islands - preserve f-* attributes", async () => {
  const app = testApp()
    .get("/", (ctx) =>
      ctx.render(
        <Doc>
          <FreshAttrs />
        </Doc>,
      ));

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address, { waitUntil: "load" });
    await page.locator(".ready").wait();

    const truthy = await page.locator<HTMLDivElement>(".f-client-nav-true")
      .evaluate((el) => el.getAttribute("f-client-nav"));
    const falsy = await page.locator<HTMLDivElement>(".f-client-nav-false")
      .evaluate((el) => el.getAttribute("f-client-nav"));

    expect(truthy).toEqual("true");
    expect(falsy).toEqual("false");
  });
});

integrationTest("islands - inlines FRESH_PUBLIC_* env vars", async () => {
  const app = testApp()
    .get("/", (ctx) =>
      ctx.render(
        <Doc>
          <EnvIsland id="test" />
        </Doc>,
      ));

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address, { waitUntil: "load" });
    await page.locator(".ready").wait();

    const denoEnv = await page.locator<HTMLDivElement>(".deno-env")
      .evaluate((el) => el.textContent);
    const denoEnv2 = await page.locator<HTMLDivElement>(".deno-env-2")
      .evaluate((el) => el.textContent);
    const processEnv = await page.locator<HTMLDivElement>(".process-env")
      .evaluate((el) => el.textContent);

    const denoEnvPrivate = await page.locator<HTMLDivElement>(
      ".deno-env-private",
    )
      .evaluate((el) => el.textContent);
    const denoEnvPrivate2 = await page.locator<HTMLDivElement>(
      ".deno-env-private-2",
    )
      .evaluate((el) => el.textContent);
    const processEnvPrivate = await page.locator<HTMLDivElement>(
      ".process-env-private",
    )
      .evaluate((el) => el.textContent);

    expect(denoEnv).toEqual("test-env-value");
    expect(denoEnv2).toEqual("test-env-value");
    expect(processEnv).toEqual("test-env-value");

    expect(denoEnvPrivate).toEqual("ok");
    expect(denoEnvPrivate2).toEqual("ok");
    expect(processEnvPrivate).toEqual("ok");
  });
});

integrationTest("fsRoutes - load islands from group folder", async () => {
  const app = testGroupApp();

  await withBrowserApp(app, async (page, address) => {
    await page.goto(`${address}/foo`, { waitUntil: "load" });
    await page.locator(".ready").wait();

    // Page would error here
    const text = await page
      .locator<HTMLDivElement>(".ready")
      .evaluate((el) => el.textContent!);
    expect(text).toEqual("it works");
  });
});

integrationTest(
  "fsRoutes - load islands from group folder with same name",
  async () => {
    const app = testGroupApp();

    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/both`, { waitUntil: "load" });

      await page.locator(".ready").wait();

      // Page would error here
      let text = await page
        .locator<HTMLDivElement>("#foo.ready")
        .evaluate((el) => el.textContent!);
      expect(text).toEqual("it works");

      text = await page
        .locator<HTMLDivElement>("#foo-both.ready")
        .evaluate((el) => el.textContent!);
      expect(text).toEqual("it works");
    });
  },
);

integrationTest("islands - adds preload HTTP headers", async () => {
  const app = testApp()
    .get("/", (ctx) =>
      ctx.render(
        <Doc>
          <SelfCounter />
        </Doc>,
      ));

  const server = new FakeServer(app.handler());
  const res = await server.get("/");
  await res.body?.cancel();

  const link = res.headers.get("Link");

  expect(link).toMatch(
    /<\/_fresh\/js\/[a-zA-Z0-9]+\/fresh-runtime\.js>; rel="modulepreload"; as="script", <\/_fresh\/js\/[a-zA-Z0-9]+\/SelfCounter\.js>; rel="modulepreload"; as="script"/,
  );
});
