/**
 * Tests for the "zero client JS by default" feature.
 *
 * Fresh should not ship any client JavaScript when a page renders no islands
 * and has no element with `f-client-nav="true"`. The full Fresh client runtime
 * (fresh-runtime.js + inline boot script) must only appear when actually needed.
 */
import { App } from "fresh";
import { signal } from "@preact/signals";
import { Counter } from "./fixtures_islands/Counter.tsx";
import { expect } from "@std/expect";
import { FakeServer } from "../src/test_utils.ts";
import {
  ALL_ISLAND_DIR,
  assertNotSelector,
  assertSelector,
  buildProd,
  Doc,
  parseHtml,
} from "./test_utils.tsx";

// Build once so all island tests share the same compiled output.
const allIslandCache = await buildProd({ islandDir: ALL_ISLAND_DIR });

function islandApp(): App<unknown> {
  const app = new App().get("/", (ctx) => {
    const sig = signal(0);
    return ctx.render(
      <Doc>
        <Counter count={sig} />
      </Doc>,
    );
  });
  allIslandCache(app);
  return app;
}

// ---------------------------------------------------------------------------
// Static pages (no islands, no f-client-nav)
// ---------------------------------------------------------------------------

Deno.test("no-client-js - static page emits no module boot script", async () => {
  const app = new App().get("/", (ctx) =>
    ctx.render(
      <Doc>
        <h1>Hello</h1>
      </Doc>,
    ));

  const server = new FakeServer(app.handler());
  const res = await server.get("/");
  const html = await res.text();
  const doc = parseHtml(html);

  // No inline module script should be present.
  assertNotSelector(doc, 'script[type="module"]');
  // Confirm the page itself rendered fine.
  assertSelector(doc, "h1");
  expect(doc.querySelector("h1")?.textContent).toEqual("Hello");
});

Deno.test("no-client-js - static page does not reference fresh-runtime.js", async () => {
  const app = new App().get("/", (ctx) =>
    ctx.render(
      <Doc>
        <p>Hi</p>
      </Doc>,
    ));

  const server = new FakeServer(app.handler());
  const res = await server.get("/");
  const html = await res.text();

  expect(html).not.toContain("fresh-runtime");
  expect(html).not.toContain("boot(");
});

Deno.test("no-client-js - static page has no Link modulepreload header", async () => {
  const app = new App().get("/", (ctx) =>
    ctx.render(
      <Doc>
        <p>Hi</p>
      </Doc>,
    ));

  const server = new FakeServer(app.handler());
  const res = await server.get("/");

  expect(res.headers.get("Link")).toBeNull();
});

// ---------------------------------------------------------------------------
// Pages with f-client-nav="true" must still load the client runtime.
// f-client-nav is typically placed in an appWrapper or layout component,
// so the VNode is created INSIDE a component that runs during renderToString
// (and therefore sees an active RENDER_STATE).
// ---------------------------------------------------------------------------

Deno.test("no-client-js - f-client-nav='true' page includes boot script", async () => {
  const app = new App()
    .appWrapper(({ Component }) => (
      <html f-client-nav>
        <head>
          <meta charset="utf-8" />
        </head>
        <body>
          <Component />
        </body>
      </html>
    ))
    .get("/", (ctx) => ctx.render(<a href="/other">Link</a>));

  const server = new FakeServer(app.handler());
  const res = await server.get("/");
  const html = await res.text();
  const doc = parseHtml(html);

  // A module script importing boot must be present.
  assertSelector(doc, 'script[type="module"]');
  expect(html).toContain("boot(");
});

Deno.test("no-client-js - f-client-nav='false' page emits no boot script", async () => {
  const app = new App()
    .appWrapper(({ Component }) => (
      <html f-client-nav={false}>
        <head>
          <meta charset="utf-8" />
        </head>
        <body>
          <Component />
        </body>
      </html>
    ))
    .get("/", (ctx) => ctx.render(<p>Static</p>));

  const server = new FakeServer(app.handler());
  const res = await server.get("/");
  const html = await res.text();

  expect(html).not.toContain("boot(");
  expect(html).not.toContain("fresh-runtime");
});

// ---------------------------------------------------------------------------
// Pages with islands must still load the client runtime
// ---------------------------------------------------------------------------

Deno.test("no-client-js - island page includes boot script", async () => {
  const app = islandApp();

  const server = new FakeServer(app.handler());
  const res = await server.get("/");
  const html = await res.text();
  const doc = parseHtml(html);

  assertSelector(doc, 'script[type="module"]');
  expect(html).toContain("boot(");
});

Deno.test("no-client-js - island page references fresh-runtime.js", async () => {
  const app = islandApp();

  const server = new FakeServer(app.handler());
  const res = await server.get("/");
  const html = await res.text();

  expect(html).toContain("fresh-runtime");
});

Deno.test("no-client-js - island page has Link modulepreload header", async () => {
  const app = islandApp();

  const server = new FakeServer(app.handler());
  const res = await server.get("/");

  const link = res.headers.get("Link");
  expect(link).not.toBeNull();
  expect(link).toContain("modulepreload");
  expect(link).toContain("fresh-runtime");
});
