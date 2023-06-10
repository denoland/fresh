import { assert, delay, puppeteer } from "./deps.ts";
import { startFreshServer } from "./test_utils.ts";

Deno.test({
  name: "wasm island tests",
  ignore: Deno.build.os === "windows",
  async fn(t) {
    // Preparation
    const { lines, serverProcess } = await startFreshServer({
      args: ["run", "-A", "./tests/fixture/main_wasm.ts"],
    });

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

    await browser.close();

    await lines.cancel();
    serverProcess.kill("SIGTERM");
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
