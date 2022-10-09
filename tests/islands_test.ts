import {
  assert,
  assertStringIncludes,
  delay,
  puppeteer,
  TextLineStream,
} from "./deps.ts";

Deno.test({
  name: "island tests",
  async fn(t) {
    // Preparation
    const serverProcess = Deno.run({
      cmd: ["deno", "run", "-A", "./tests/fixture/main.ts"],
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

    async function counterTest(counterId: string, originalValue: number) {
      const pElem = await page.waitForSelector(`#${counterId} > p`);
      let value = await pElem?.evaluate((el) => el.textContent);
      assert(value === `${originalValue}`, `${counterId} first value`);

      const buttonPlus = await page.$(`#b-${counterId}`);
      await buttonPlus?.click();
      await delay(100);
      value = await pElem?.evaluate((el) => el.textContent);
      assert(value === `${originalValue + 1}`, `${counterId} click`);
    }

    await page.goto("http://localhost:8000/islands", {
      waitUntil: "networkidle2",
    });

    await t.step("Ensure 3 islands on 1 page are revived", async () => {
      await counterTest("counter1", 3);
      await counterTest("counter2", 10);
      await counterTest("kebab-case-file-counter", 5);
    });

    await t.step("Ensure an island revive an img 'hash' path", async () => {
      // Ensure src path has __frsh_c=
      const pElem = await page.waitForSelector(`#img-in-island`);
      const srcString = (await pElem?.getProperty("src"))?.toString()!;
      assertStringIncludes(srcString, "image.png?__frsh_c=");

      // Ensure src path is the same as server rendered
      const resp = await fetch(new Request("http://localhost:8000/islands"));
      const body = await resp.text();
      const imgFilePath = body.match(/img id="img-in-island" src="(.*?)"/)
        ?.[1]!;
      assertStringIncludes(srcString, imgFilePath);
    });

    await browser.close();

    await lines.cancel();
    serverProcess.kill("SIGTERM");
    serverProcess.close();
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "island tests with </script>",
  async fn(t) {
    // Preparation
    const serverProcess = Deno.run({
      cmd: ["deno", "run", "-A", "./tests/fixture/main.ts"],
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
    page.on("dialog", () => {
      assert(false, "There is XSS");
    });

    await page.goto("http://localhost:8000/evil", {
      waitUntil: "networkidle2",
    });

    await t.step("prevent XSS on Island", async () => {
      const bodyElem = await page.waitForSelector(`body`);
      const value = await bodyElem?.evaluate((el) => el.getInnerHTML());

      assertStringIncludes(
        value,
        `{"message":"\\u003c/script\\u003e\\u003cscript\\u003ealert('test')\\u003c/script\\u003e"}`,
        `XSS is not escaped`,
      );
    });

    await browser.close();

    await lines.cancel();
    serverProcess.kill("SIGTERM");
    serverProcess.close();
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
