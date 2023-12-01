import { assert } from "./deps.ts";
import { withPageName } from "./test_utils.ts";

Deno.test({
  name: "IslandWithWorker - Web Worker Execution",
  async fn(t) {
    await withPageName("./tests/fixture/main.ts", async (page, address) => {
      const workerMessages: string[] = [];

      page.on("console", (msg) => {
        workerMessages.push(msg.text());
      });

      await page.goto(`${address}/worker`, {
        waitUntil: "networkidle2",
      });

      await t.step("Web worker status", () => {
        const expectedMessages = [
          "secondWorker received message: hook helped here",
          "secondWorker received message: message to secondWorker",
          "received in main for second worker: sending from secondWorker",
          "received in main for second worker: sending from secondWorker",
          "myFirstWorker received message: send first message to myFirstWorker",
          "received in main for first worker: hello from myFirstWorker",
          "doStuff says: hook helped here",
          "this is from the hook: doStuff reporting for duty",
        ];

        const missingMessages = expectedMessages.filter(
          (expectedMessage) => !workerMessages.includes(expectedMessage),
        );

        assert(
          missingMessages.length === 0,
          `The following messages are missing in workerMessages: ${
            missingMessages.join(", ")
          }`,
        );
      });
    });
  },
});
