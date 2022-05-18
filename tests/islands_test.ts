import { assert, delay, puppeteer, TextLineStream } from "./deps.ts";

Deno.test({
  name: "island tests",
  async fn(t) {
    // Preparation
    const serverProcess = Deno.run({
      cmd: ["deno", "run", "-A", "--no-check", "./tests/fixture/main.ts"],
      // stdout: "piped",
      // stderr: "inherit",
    });

    // verify the island is revived.
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();

    await delay(100);

    await t.step("Ensure 2 islands on 1 page are revived", async () => {
      await page.goto("http://localhost:8000/islands");
      await delay(500);
      
      // counter 1
      const counter1 = await page.$("#counter1 > p");
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

    serverProcess.kill("SIGTERM");
    serverProcess.close();
  },
});
