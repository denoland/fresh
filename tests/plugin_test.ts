import { ServerContext, Status } from "../server.ts";
import {
  assert,
  assertEquals,
  assertStringIncludes,
  delay,
  puppeteer,
  TextLineStream,
} from "./deps.ts";
import manifest from "./fixture_plugin/fresh.gen.ts";
import options from "./fixture_plugin/options.ts";

const ctx = await ServerContext.fromManifest(manifest, options);
const router = (req: Request) => {
  return ctx.handler()(req, {
    localAddr: {
      transport: "tcp",
      hostname: "127.0.0.1",
      port: 80,
    },
    remoteAddr: {
      transport: "tcp",
      hostname: "127.0.0.1",
      port: 80,
    },
  });
};

Deno.test("/static page prerender", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/static"));
  assert(resp);
  assertEquals(resp.status, Status.OK);
  const body = await resp.text();
  assertStringIncludes(body, '<style id="abc">body { color: red; }</style>');
  assert(!body.includes(`>[[],[]]</script>`));
  assert(!body.includes(`import`));
});

Deno.test("/with-island prerender", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/with-island"));
  assert(resp);
  assertEquals(resp.status, Status.OK);
  const body = await resp.text();
  assertStringIncludes(
    body,
    '<style id="abc">body { color: red; } h1 { color: blue; }</style>',
  );
  assertStringIncludes(body, `>[[{}],["JS injected!"]]</script>`);
  assertStringIncludes(body, `/plugin-js-inject-main.js"`);
});

Deno.test({
  name: "/with-island hydration",
  async fn(t) {
    // Preparation
    const serverProcess = Deno.run({
      cmd: ["deno", "run", "-A", "./tests/fixture_plugin/main.ts"],
      stdout: "piped",
      stderr: "inherit",
    });

    const decoder = new TextDecoderStream();
    const lines = serverProcess.stdout.readable
      .pipeThrough(decoder)
      .pipeThrough(new TextLineStream());

    let started = false;
    for await (const line of lines) {
      if (line.includes("Listening on http://")) {
        started = true;
        break;
      }
    }
    if (!started) {
      throw new Error("Server didn't start up");
    }

    await delay(100);

    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();

    await page.goto("http://localhost:8000/with-island", {
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

    await lines.cancel();
    serverProcess.kill("SIGTERM");
    serverProcess.close();
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
