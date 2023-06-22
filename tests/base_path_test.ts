import { Status } from "$fresh/server.ts";
import { assertMatch } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { assert, assertEquals, delay, puppeteer } from "./deps.ts";
import { startFreshServer } from "./test_utils.ts";
import { stripColor } from "https://deno.land/std@0.190.0/fmt/colors.ts";

Deno.test("redirects on incomplete base path in url", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async () => {
  const { serverProcess, lines, address } = await startFreshServer({
    args: ["run", "-A", "./tests/fixture_base_path/main.ts"],
  });

  await delay(100);

  const url = new URL(address);
  const res = await fetch(url.origin);
  assert(
    res.url.endsWith("/foo/bar"),
    `didn't redirect to base path: "${res.url}"`,
  );
  assert(res.redirected, "did not redirect");
  assertEquals(res.status, Status.OK);

  await lines.cancel();
  serverProcess.kill("SIGTERM");
});

Deno.test("shows full address with base path in cli", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async () => {
  const { serverProcess, lines, address } = await startFreshServer({
    args: ["run", "-A", "./tests/fixture_base_path/main.ts"],
  });

  assertMatch(address, /^http:\/\/localhost:\d+\/foo\/bar$/);
  await lines.cancel();
  serverProcess.kill("SIGTERM");
});

Deno.test("takes basePath from ENV", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async () => {
  const { serverProcess, lines, address } = await startFreshServer({
    args: ["run", "-A", "./tests/fixture_base_path/main.ts"],
    env: {
      FRESH_BASE_PATH: "/baz/boof",
    },
  });

  assertMatch(address, /^http:\/\/localhost:\d+\/baz\/boof$/);
  await lines.cancel();
  serverProcess.kill("SIGTERM");
});

Deno.test("rewrites middleware request", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async () => {
  const { serverProcess, lines, address } = await startFreshServer({
    args: ["run", "-A", "./tests/fixture_base_path/main.ts"],
  });

  const res = await fetch(`${address}/api`);
  const body = await res.text();
  assertEquals(body, "it works");

  await lines.cancel();
  serverProcess.kill("SIGTERM");
});

Deno.test("rewrites root relative middleware redirects", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async () => {
  const { serverProcess, lines, address } = await startFreshServer({
    args: ["run", "-A", "./tests/fixture_base_path/main.ts"],
  });

  const res = await fetch(`${address}/api/rewrite`);
  assertEquals(res.status, Status.OK);
  assertEquals(res.url, address);

  await lines.cancel();
  serverProcess.kill("SIGTERM");
});

Deno.test("passes basePath to route handlers", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async () => {
  const { serverProcess, lines, address } = await startFreshServer({
    args: ["run", "-A", "./tests/fixture_base_path/main.ts"],
  });

  const res = await fetch(`${address}/api/base-handler`);
  assertEquals(res.status, Status.OK);
  assertEquals(await res.text(), "/foo/bar");

  await lines.cancel();
  serverProcess.kill("SIGTERM");
});

Deno.test("works with relative urls", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async () => {
  const { serverProcess, lines, address } = await startFreshServer({
    args: ["run", "-A", "./tests/fixture_base_path/main.ts"],
  });

  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto(`${address}/a/b/relative`);

  await Promise.all([
    page.waitForNavigation(),
    page.click("a"),
  ]);

  const html = await page.content();
  assertMatch(html, /it works/);

  await lines.cancel();
  await browser.close();
  serverProcess.kill("SIGTERM");
});

Deno.test("rewrites root relative URLs in HTML", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async () => {
  const { serverProcess, lines, address } = await startFreshServer({
    args: ["run", "-A", "./tests/fixture_base_path/main.ts"],
  });

  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto(`${address}/html`);

  const script = await page.$eval("#script-output", (el) => el.textContent);
  assertEquals(script, "it works");

  const img = await page.$eval("img", (el) => ({
    src: el.src,
  }));
  assertMatch(img.src, /\/foo\/bar\/img\.png/);

  const img2 = await page.$eval(".img-srcset", (el) => ({
    src: el.src,
    srcset: el.srcset,
  }));
  assertMatch(img2.src, /\/foo\/bar\/img\.png/);
  assertMatch(
    img2.srcset,
    /\/foo\/bar\/img\.png.* 480w,.*\/foo\/bar\/img\.png.* 800w/,
  );

  const source = await page.$eval("picture source", (el) => ({
    srcset: el.srcset,
  }));
  assertMatch(
    source.srcset,
    /\/foo\/bar\/img\.png/,
  );

  const style = await page.$eval(
    ".foo",
    (el) => window.getComputedStyle(el).color,
  );
  assertMatch(
    style,
    /rgb\(255,\s+0,\s+0\)/,
  );

  await lines.cancel();
  await browser.close();
  serverProcess.kill("SIGTERM");
});

Deno.test("throws on invalid basePath value", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async () => {
  const output = await new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "./tests/fixture_base_path/main.ts"],
    env: {
      FRESH_BASE_PATH: "/",
    },
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
  }).output();

  const stderr = stripColor(new TextDecoder().decode(output.stderr));

  assertEquals(output.code, 1);
  assertMatch(stderr, /"basePath" option must not end with "\/"/);
});
