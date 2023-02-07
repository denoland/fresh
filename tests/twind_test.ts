import {
  assert,
  assertStringIncludes,
  delay,
  puppeteer,
  TextLineStream,
} from "./deps.ts";

Deno.test({
  name: "twind tests",
  async fn(t) {
    // Preparation
    const serverProcess = Deno.run({
      cmd: ["deno", "run", "-A", "./tests/fixture_twind/main.ts"],
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

    await page.goto("http://localhost:8000/simple", {
      waitUntil: "networkidle2",
    });

    await t.step("inject CSS by twind plugin", async () => {
      const pElem = await page.waitForSelector(`#__FRSH_TWIND`);
      const value = await pElem?.evaluate((el) => el.textContent);
      assertStringIncludes(value, ".bg-green-100");
      assertStringIncludes(value, ".text-green-800");
      assertStringIncludes(value, ".text-4xl");
      assertStringIncludes(value, ".font-bold");
      assert(!value?.includes("text-5xl"));
    });

    await browser.close();

    await lines.cancel();
    serverProcess.kill("SIGTERM");
    serverProcess.close();
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
