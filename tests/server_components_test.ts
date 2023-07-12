import { assertEquals } from "./deps.ts";
import { startFreshServer, withPageName } from "./test_utils.ts";
import { Status } from "../server.ts";

Deno.test({
  name: "render async server component",

  async fn() {
    await withPageName(
      "./tests/fixture_server_components/main.ts",
      async (page, address) => {
        await page.goto(`${address}/basic`);

        await page.waitForSelector("h1");
        const text = await page.$eval("h1", (el) => el.textContent);
        assertEquals(text, "it works");
      },
    );
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "uses returned response",

  async fn() {
    await withPageName(
      "./tests/fixture_server_components/main.ts",
      async (page, address) => {
        await page.goto(`${address}/response`);

        const text = await page.$eval("body", (el) => el.textContent);
        assertEquals(text, "it works");
      },
    );
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "revives islands in async server component",

  async fn() {
    await withPageName(
      "./tests/fixture_server_components/main.ts",
      async (page, address) => {
        await page.goto(`${address}/island`);

        await page.waitForSelector("button");
        let text = await page.$eval("button", (el) => el.textContent);
        assertEquals(text, "update 0");

        await page.click("button");
        text = await page.$eval("button", (el) => el.textContent);
        assertEquals(text, "update 1");
      },
    );
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "passes context to server component",

  async fn() {
    const { lines, serverProcess, address } = await startFreshServer({
      args: ["run", "-A", "./tests/fixture_server_components/main.ts"],
    });

    const res = await fetch(`${address}/context/foo`);
    const json = await res.json();

    assertEquals(typeof json.localAddr, "object");
    assertEquals(typeof json.remoteAddr, "object");
    json.localAddr.port = 8000;
    json.remoteAddr.port = 8000;

    assertEquals(
      json,
      {
        localAddr: {
          hostname: "localhost",
          port: 8000,
          transport: "tcp",
        },
        remoteAddr: {
          hostname: "localhost",
          port: 8000,
          transport: "tcp",
        },
        renderNotFound: "AsyncFunction",
        url: `${address}/context/foo`,
        route: "/context/:id",
        params: {
          id: "foo",
        },
        state: {},
      },
    );
    await lines.cancel();
    serverProcess.kill("SIGTERM");
    await serverProcess.status;
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "can call context.renderNotFound()",

  async fn() {
    const { lines, serverProcess, address } = await startFreshServer({
      args: ["run", "-A", "./tests/fixture_server_components/main.ts"],
    });

    const res = await fetch(`${address}/fail`);

    assertEquals(res.status, Status.NotFound);
    const html = await res.text();
    assertEquals(html, "Not found.");

    await lines.cancel();
    serverProcess.kill("SIGTERM");
    await serverProcess.status;
  },

  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "works with async plugins",

  async fn() {
    await withPageName(
      "./tests/fixture_server_components/main.ts",
      async (page, address) => {
        await page.goto(`${address}/twind`);
        await page.waitForSelector("h1");

        const text = await page.$eval("body", (el) => el.textContent);
        assertEquals(text, "it works");

        // Check that CSS was applied accordingly
        const color = await page.$eval("h1", (el) => {
          return window.getComputedStyle(el).color;
        });
        assertEquals(color, "rgb(220, 38, 38)");
      },
    );
  },

  sanitizeOps: false,
  sanitizeResources: false,
});
