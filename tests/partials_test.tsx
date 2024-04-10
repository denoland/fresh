import { FreshApp, freshStaticFiles } from "@fresh/core";
import { Partial } from "@fresh/core/runtime";
import {
  Doc,
  getIsland,
  waitFor,
  waitForText,
  withBrowserApp,
} from "./test_utils.tsx";
import { SelfCounter } from "./fixtures_islands/SelfCounter.tsx";
import { parseHtml } from "./test_utils.tsx";
import { assertNotSelector } from "./test_utils.tsx";

Deno.test("partials - updates content", async () => {
  const app = new FreshApp()
    .use(freshStaticFiles())
    .get("/partial", (ctx) => {
      return ctx.render(
        <Partial name="foo">
          <p class="output">partial update</p>
        </Partial>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <a href="/partial" class="update">update</a>
            <Partial name="foo">
              <p class="output">hello world</p>
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.click(".update");
    await waitForText(page, ".output", "partial update");
  });
});

Deno.test("partials - revive island not seen before", async () => {
  const selfCounter = getIsland("SelfCounter.tsx");
  const app = new FreshApp()
    .island(selfCounter, "SelfCounter", SelfCounter)
    .use(freshStaticFiles())
    .get("/partial", (ctx) => {
      // FIXME: Add outer document
      return ctx.render(
        <Doc>
          <Partial name="foo">
            <SelfCounter />
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <a href="/partial" class="update">update</a>
            <Partial name="foo">
              <p class="init">hello world</p>
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.click(".update");
    await page.waitForSelector(".ready");
    await page.click(".increment");
    await waitForText(page, ".output", "1");

    const doc = parseHtml(await page.content());
    assertNotSelector(doc, ".init");
  });
});

Deno.test("partials - warn on missing partial", async () => {
  const app = new FreshApp()
    .use(freshStaticFiles())
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="bar">
            <p class="ready">bar</p>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <a href="/partial" class="update">update</a>
            <Partial name="foo">
              <p class="init">hello world</p>
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    const logs: string[] = [];
    page.on("console", (msg) => logs.push(msg.text()));

    await page.goto(address);
    await page.click(".update");

    await waitFor(() => logs.find((line) => /^Partial.*not found/.test(line)));
  });
});
