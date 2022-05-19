import { assert, puppeteer, TextLineStream } from "./deps.ts";

Deno.test({
  name: "island tests",
  async fn(t) {
    // Preparation
    const serverProcess = Deno.run({
      cmd: ["deno", "run", "-A", "--no-check", "./tests/fixture/main.ts"],
      stdout: "piped",
      stderr: "inherit",
    });

    const decoder = new TextDecoderStream();
    const lines = serverProcess.stdout.readable
      .pipeThrough(decoder)
      .pipeThrough(new TextLineStream());

    let started = false;
    for await (const line of lines) {
      console.log(line);
      if (line.includes("Server listening on http://")) {
        started = true;
        break;
      }
    }
    if (!started) {
      throw new Error("Server didn't start up");
    }

    // verify the island is revived.
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();

    await t.step("Ensure 2 islands on 1 page are revived", async () => {
      await page.goto("http://localhost:8000/islands");

      // counter 1
      const counter1 = await page.waitForSelector("#counter1 > p");
      let counter1Value = await counter1?.evaluate((el) => el.textContent);
      assert(counter1Value === "3");

      const c1ButtonPlus = await page.$("#counter1 > button:nth-child(3)");
      await c1ButtonPlus?.click();
      counter1Value = await counter1?.evaluate((el) => el.textContent);
      assert(counter1Value === "4");

      // counter 2
      const counter2 = await page.$("#counter2 > p");
      let counter2Value = await counter2?.evaluate((el) => el.textContent);
      assert(counter2Value === "10");

      const c2ButtonPlus = await page.$("#counter2 > button:nth-child(3)");
      await c2ButtonPlus?.click();
      counter2Value = await counter2?.evaluate((el) => el.textContent);
      assert(counter2Value === "11");
    });

    await browser.close();

    await lines.cancel();
    serverProcess.kill("SIGTERM");
    serverProcess.close();
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
