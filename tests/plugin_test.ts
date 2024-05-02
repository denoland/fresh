import { type FreshConfig, ServerContext, STATUS_CODE } from "../server.ts";
import {
  assert,
  assertEquals,
  assertMatch,
  assertStringIncludes,
  delay,
  join,
  puppeteer,
} from "./deps.ts";
import manifest from "./fixture_plugin/fresh.gen.ts";
import config from "./fixture_plugin/fresh.config.ts";
import {
  clickWhenListenerReady,
  runBuild,
  startFreshServer,
  withFakeServe,
  withPageName,
} from "./test_utils.ts";
import routePlugin from "./fixture_plugin/utils/route-plugin.ts";
import secondMiddlewarePlugin from "./fixture_plugin/utils/second-middleware-plugin.ts";

const ctx = await ServerContext.fromManifest(manifest, config);
const handler = ctx.handler();
const router = (req: Request) => {
  return handler(req, {
    remoteAddr: {
      transport: "tcp",
      hostname: "127.0.0.1",
      port: 80,
    },
    // deno-lint-ignore no-explicit-any
  } as any);
};

Deno.test("/static page prerender", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/static"));
  assert(resp);
  assertEquals(resp.status, STATUS_CODE.OK);
  const body = await resp.text();
  assertStringIncludes(body, '<style id="abc">body { color: red; }</style>');
  assert(!body.includes(`>{"v":[[],[]]}</script>`));
  assert(!body.includes(`import`));
  assertStringIncludes(
    body,
    '<style id="def">h1 { text-decoration: underline; }</style>',
  );
  assertStringIncludes(body, '<link rel="stylesheet" href="styles.css"/>');
  assertStringIncludes(
    body,
    '<link rel="stylesheet" href="print.css" media="print"/>',
  );
});

Deno.test("/with-island prerender", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/with-island"));
  assert(resp);
  assertEquals(resp.status, STATUS_CODE.OK);
  const body = await resp.text();
  assertStringIncludes(
    body,
    '<style id="abc">body { color: red; } h1 { color: blue; }</style>',
  );
  assertStringIncludes(body, `>{"v":[[{}],["JS injected!"]]}</script>`);
  assertStringIncludes(body, `/plugin-js-inject-main.js"`);
  assertStringIncludes(
    body,
    '<style id="def">h1 { text-decoration: underline; } h1 { font-style: italic; }</style>',
  );
});

Deno.test("plugin routes and middleware", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/test"));
  assert(resp);
  assertEquals(resp.status, STATUS_CODE.OK);
  const body = await resp.text();
  assertStringIncludes(
    body,
    `<h1>look, i'm set from a plugin!</h1>`,
  );
  assertStringIncludes(
    body,
    `<title>Title Set From Plugin Config</title>`,
  );
});

Deno.test("plugin routes and middleware -- async _app", async () => {
  const ctx = await ServerContext.fromManifest(manifest, {
    plugins: [
      routePlugin({ title: "Title Set From Plugin Config", async: true }),
      secondMiddlewarePlugin(),
    ],
  } as FreshConfig);
  const handler = ctx.handler();
  const router = (req: Request) => {
    return handler(req, {
      remoteAddr: {
        transport: "tcp",
        hostname: "127.0.0.1",
        port: 80,
      },
      // deno-lint-ignore no-explicit-any
    } as any);
  };

  const resp = await router(new Request("https://fresh.deno.dev/test"));
  assert(resp);
  assertEquals(resp.status, STATUS_CODE.OK);
  const body = await resp.text();
  assertStringIncludes(
    body,
    `<h1>look, i'm set from a plugin!</h1>`,
  );
  assertStringIncludes(
    body,
    `<title>Title Set From Plugin Config</title>`,
  );
});

Deno.test("plugin middleware multiple handlers", async () => {
  const resp = await router(
    new Request("https://fresh.deno.dev/lots-of-middleware"),
  );
  assert(resp);
  assertEquals(resp.status, STATUS_CODE.OK);
  const body = await resp.text();
  assertStringIncludes(
    body,
    `<h1>3</h1>`,
  );
});

Deno.test("plugin route no leading slash", async () => {
  const resp = await router(
    new Request("https://fresh.deno.dev/no-leading-slash-here"),
  );
  assert(resp);
  assertEquals(resp.status, STATUS_CODE.OK);
  const body = await resp.text();
  assertStringIncludes(
    body,
    `<div>Hello</div>`,
  );
});

Deno.test("plugin async route", async () => {
  const resp = await router(
    new Request("https://fresh.deno.dev/async-route"),
  );
  assert(resp);
  assertEquals(resp.status, STATUS_CODE.OK);
  const body = await resp.text();
  assertStringIncludes(
    body,
    `<div>this is an async route!</div>`,
  );
});

Deno.test({
  name: "plugin supports islands",
  async fn(t) {
    await withPageName(
      "./tests/fixture_plugin/main.ts",
      async (page, address) => {
        async function idTest(id: string) {
          const elem = await page.waitForSelector(`#${id}`);

          const value = await elem?.evaluate((el) => el.textContent);
          assert(value === `${id}`, `value ${value} not equal to id ${id}`);
        }

        await page.goto(`${address}/pluginroutewithisland`, {
          waitUntil: "networkidle2",
        });

        await t.step("verify tags", async () => {
          await idTest("csr");
          await idTest("csr_alt_folder");
        });
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "/with-island hydration",
  async fn(t) {
    // Preparation
    const { lines, serverProcess, address } = await startFreshServer({
      args: ["run", "-A", "./tests/fixture_plugin/main.ts"],
    });

    await delay(100);

    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();

    await page.goto(`${address}/with-island`, {
      waitUntil: "networkidle2",
    });

    await t.step("island is revived", async () => {
      await page.waitForSelector("#csr");
    });

    await t.step("title was updated", async () => {
      const title = await page.title();
      assertEquals(title, "JS injected!");
    });

    await browser.close();

    serverProcess.kill("SIGTERM");
    await serverProcess.status;

    // Drain the lines stream
    for await (const _ of lines) { /* noop */ }
  },
});

Deno.test("calls buildStart() and buildEnd()", async () => {
  const result = await runBuild("./tests/fixture_plugin_lifecycle/dev.ts");

  const out = result.stdout.split("\n").filter((line) =>
    line.startsWith("Plugin")
  );

  assertEquals(out, [
    "Plugin a: configResolved",
    "Plugin b: configResolved",
    "Plugin c: configResolved",
    "Plugin a: buildStart",
    "Plugin b: buildStart",
    `Plugin c: ${join("tests", "fixture_plugin_lifecycle", "_fresh")}`,
    "Plugin a: buildEnd",
    "Plugin b: buildEnd",
  ]);
});

Deno.test("calls configResolved() in dev", async () => {
  await withFakeServe(
    "./tests/fixture_plugin_resolved_dev/dev.ts",
    async (server) => {
      const res = await server.get("/");
      await res.text();
      assertEquals(res.headers.get("X-Plugin-A"), "true");
    },
    { loadConfig: true },
  );
});

Deno.test("plugin script doesn't halt island execution", async () => {
  await withPageName(
    "./tests/fixture_plugin_error/main.ts",
    async (page, address) => {
      let error;
      page.on("pageerror", (err) => {
        error = err;
      });
      await page.goto(address);
      await page.waitForSelector("#ready");

      let text = await page.$eval("p", (el) => el.textContent!);
      assertEquals(text, "0");

      await clickWhenListenerReady(page, "button");

      text = await page.$eval("p", (el) => el.textContent!);
      assertEquals(text, "1");

      assertMatch(String(error), /Error thrown/);
    },
  );
});

Deno.test("supports returning htmlText", async () => {
  await withFakeServe(
    "./tests/fixture_plugin_html/main.ts",
    async (server) => {
      const doc = await server.getHtml("/");
      assertEquals(doc.body.textContent, "it works");
    },
    { loadConfig: true },
  );
});
