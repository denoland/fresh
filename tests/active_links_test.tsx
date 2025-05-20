import { App, staticFiles } from "@fresh/core";
import {
  allIslandApp,
  assertNotSelector,
  assertSelector,
  buildProd,
  Doc,
  getIsland,
  parseHtml,
  withBrowserApp,
} from "./test_utils.tsx";

import { SelfCounter } from "./fixtures_islands/SelfCounter.tsx";
import { PartialInIsland } from "./fixtures_islands/PartialInIsland.tsx";
import { JsonIsland } from "./fixtures_islands/JsonIsland.tsx";
import { FakeServer } from "../src/test_utils.ts";
import { Partial } from "@fresh/core/runtime";
import { getBuildCache, setBuildCache } from "../src/app.ts";

await buildProd(allIslandApp);

function testApp<T>(): App<T> {
  const selfCounter = getIsland("SelfCounter.tsx");
  const partialInIsland = getIsland("PartialInIsland.tsx");
  const jsonIsland = getIsland("JsonIsland.tsx");

  const app = new App<T>()
    .island(selfCounter, "SelfCounter", SelfCounter)
    .island(partialInIsland, "PartialInIsland", PartialInIsland)
    .island(jsonIsland, "JsonIsland", JsonIsland)
    .use(staticFiles());
  setBuildCache(app, getBuildCache(allIslandApp));
  return app;
}

Deno.test({
  name: "active links - without client nav",
  fn: async () => {
    function View() {
      return (
        <Doc>
          <div>
            <h1>nav</h1>
            <p>
              <a href="/active_nav/foo/bar">/active_nav/foo/bar</a>
            </p>
            <p>
              <a href="/active_nav/foo">/active_nav/foo</a>
            </p>
            <p>
              <a href="/active_nav">/active_nav</a>
            </p>
            <p>
              <a href="/">/</a>
            </p>
          </div>
        </Doc>
      );
    }

    const app = testApp()
      .get("/active_nav/foo", (ctx) => {
        return ctx.render(<View />);
      })
      .get("/active_nav", (ctx) => {
        return ctx.render(<View />);
      });

    const server = new FakeServer(app.handler());
    let res = await server.get("/active_nav");
    let doc = parseHtml(await res.text());

    assertSelector(doc, "a[href='/'][data-ancestor]");

    // Current
    assertNotSelector(doc, "a[href='/active_nav'][data-ancestor]");
    assertSelector(doc, "a[href='/active_nav'][data-current]");
    assertSelector(doc, `a[href='/active_nav'][aria-current="page"]`);

    // Unrelated links
    assertNotSelector(doc, "a[href='/active_nav/foo'][data-ancestor]");
    assertNotSelector(doc, "a[href='/active_nav/foo'][aria-current]");
    assertNotSelector(doc, "a[href='/active_nav/foo/bar'][data-ancestor]");
    assertNotSelector(doc, "a[href='/active_nav/foo/bar'][aria-current]");

    res = await server.get(`/active_nav/foo`);
    doc = parseHtml(await res.text());
    assertSelector(doc, "a[href='/active_nav/foo'][data-current]");
    assertSelector(doc, `a[href='/active_nav/foo'][aria-current="page"]`);
    assertSelector(doc, "a[href='/active_nav'][data-ancestor]");
    assertSelector(doc, `a[href='/active_nav'][aria-current="true"]`);
    assertSelector(doc, "a[href='/'][data-ancestor]");
    assertSelector(doc, `a[href='/'][aria-current="true"]`);
  },
});

Deno.test({
  name: "active links - updates outside of vdom",
  fn: async () => {
    function PartialPage() {
      return (
        <div>
          <Partial name="content">
            <h1>/active_nav_partial</h1>
          </Partial>
          <p>
            <a href="/active_nav_partial/foo/bar">
              /active_nav_partial/foo/bar
            </a>
          </p>
          <p>
            <a href="/active_nav_partial/foo">/active_nav_partial/foo</a>
          </p>
          <p>
            <a href="/active_nav_partial">/active_nav_partial</a>
          </p>
          <p>
            <a href="/">/</a>
          </p>
        </div>
      );
    }

    const app = testApp()
      .get("/active_nav_partial/foo", (ctx) => {
        return ctx.render(<PartialPage />);
      })
      .get("/active_nav_partial", (ctx) => {
        return ctx.render(<PartialPage />);
      });

    await withBrowserApp(app, async (page, address) => {
      await page.goto(`${address}/active_nav_partial`);

      let doc = parseHtml(await page.content());
      assertSelector(doc, "a[href='/'][data-ancestor]");

      // Current
      assertNotSelector(doc, "a[href='/active_nav_partial'][data-ancestor]");
      assertSelector(doc, "a[href='/active_nav_partial'][data-current]");
      assertSelector(doc, `a[href='/active_nav_partial'][aria-current="page"]`);

      // Unrelated links
      assertNotSelector(
        doc,
        "a[href='/active_nav_partial/foo'][data-ancestor]",
      );
      assertNotSelector(
        doc,
        "a[href='/active_nav_partial/foo'][aria-current]",
      );
      assertNotSelector(
        doc,
        "a[href='/active_nav_partial/foo/bar'][data-ancestor]",
      );
      assertNotSelector(
        doc,
        "a[href='/active_nav_partial/foo/bar'][aria-current]",
      );

      await page.goto(`${address}/active_nav_partial/foo`);
      doc = parseHtml(await page.content());
      assertSelector(doc, "a[href='/active_nav_partial/foo'][data-current]");
      assertSelector(
        doc,
        `a[href='/active_nav_partial/foo'][aria-current="page"]`,
      );
      assertSelector(doc, "a[href='/active_nav_partial'][data-ancestor]");
      assertSelector(
        doc,
        `a[href='/active_nav_partial'][data-ancestor][aria-current="true"]`,
      );
      assertSelector(doc, "a[href='/'][data-ancestor]");
      assertSelector(doc, `a[href='/'][aria-current="true"]`);
    });
  },
});
