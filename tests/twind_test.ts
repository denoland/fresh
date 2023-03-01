import { assert, delay, puppeteer, TextLineStream } from "./deps.ts";

import { cmpStringArray } from "./fixture_twind/utils/utils.ts";

Deno.test({
  name: "twind static test",
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

    /**
     * Compare the class of element of any id with the selectorText of cssrules in stylesheet.
     * Ensure that twind compliles the class of element.
     *
     */
    async function compiledCssRulesTest(id: string, styleId: string) {
      const elemClassList = await page.evaluate((selector) => {
        const classList = document.querySelector(selector)?.classList;
        if (classList != null) {
          return Array.from(classList);
        } else {
          return [];
        }
      }, `#${id}`);
      assert(elemClassList.length !== 0, `Element of id=${id} has no class`);

      const twindCssRules = await page.evaluate((selector) => {
        const styleElem = document.querySelector(selector);
        if (styleElem == null) {
          return [];
        }
        const cssRules = (styleElem as HTMLStyleElement).sheet?.cssRules;
        if (cssRules == null) {
          return [];
        }

        return Array.from(cssRules).map((cssRule) => {
          const cssStyleRule = cssRule as CSSStyleRule;
          return cssStyleRule.selectorText;
        });
      }, `#${styleId}`);

      const twindCssRulesSet = new Set(twindCssRules);

      for (const elemClass of elemClassList) {
        assert(
          twindCssRulesSet.has("." + elemClass),
          `'${elemClass}' is not compiled by twind`
        );
      }
    }

    await page.goto("http://localhost:8000/static", {
      waitUntil: "networkidle2",
    });

    await t.step("Twind complies cssrules from dom class in ssr", async () => {
      await compiledCssRulesTest("helloTwind", "__FRSH_TWIND");
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
  name: "No duplicate twind cssrules",
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

    /**
     * Ensure that the cssrule of the two style elements specified do not duplicate.
     * PR946 fails and PR1050 passes.
     */
    async function noDuplicatesTest(
      twindStyleElemSelector: string,
      twindClaimedStyleElemSelector: string
    ) {
      const twindCssRuleList = await page.evaluate((selector) => {
        const elem = document.querySelector(selector) as HTMLStyleElement;
        const cssRules = elem?.sheet?.cssRules;
        if (cssRules != null) {
          return Array.from(cssRules).map((el) => {
            return el.cssText;
          });
        } else {
          return null;
        }
      }, twindStyleElemSelector);

      if (twindCssRuleList == null) {
        assert(false, `StyleElement(${twindStyleElemSelector}) is no exists`);
      }

      const twindClaimedCssRuleList = await page.evaluate((selector) => {
        const elem = document.querySelector(selector) as HTMLStyleElement;
        const cssRules = elem?.sheet?.cssRules;
        if (cssRules != null) {
          return Array.from(cssRules).map((el) => {
            return el.cssText;
          });
        } else {
          return null;
        }
      }, twindClaimedStyleElemSelector);

      if (twindClaimedCssRuleList == null) {
        // There is only one style element by twind.
        return;
      }

      const numDuplicates = cmpStringArray(
        twindCssRuleList,
        twindClaimedCssRuleList
      );

      assert(false, `${numDuplicates} cssrules are duplicated`);
    }

    await page.goto("http://localhost:8000/check-duplication", {
      waitUntil: "networkidle2",
    });

    await t.step("Ensure no dupulicate twind cssrules in islands", async () => {
      await noDuplicatesTest(
        "#__FRSH_TWIND",
        '[data-twind="claimed"]:not(#__FRSH_TWIND)'
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

Deno.test({
  name: "Dynamically insert cssrules",
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

    async function DynamicallyInsertCssrulesTest() {
      const numCssRulesBeforeInsert = await page.$eval(
        "#__FRSH_TWIND",
        (el) => {
          const styleElem = el as HTMLStyleElement;
          const cssRules = styleElem.sheet?.cssRules;
          const numCssRules = cssRules?.length;

          return numCssRules != null ? numCssRules : NaN;
        }
      );

      assert(
        !isNaN(numCssRulesBeforeInsert),
        "StyleElement(#__FRSH_TWIND) is no exists"
      );

      const hasClassBeforeInsert = await page.$eval(
        "#currentNumCssRules",
        (el) => {
          return Array.from(el.classList) as string[];
        }
      );

      // After clicking, `text-green-600` is added to the class of the element in #currentNumCssRules.
      await page.$eval("#insertCssRuleButton", (el) => {
        return el.click();
      });

      const [numCssRulesAfterInsert, twindCssRulesAfterInsert] =
        await page.$eval("#__FRSH_TWIND", (el) => {
          const styleElem = el as HTMLStyleElement;
          const cssRules = styleElem.sheet?.cssRules;
          const numCssRules = cssRules?.length;
          const cssRulesSelectorTextArray =
            cssRules != null
              ? Array.from(cssRules).map((el) => {
                  return (el as CSSStyleRule).selectorText;
                })
              : null;

          return [
            numCssRules != null ? numCssRules : NaN,
            cssRulesSelectorTextArray,
          ] as [number, string[] | null];
        });

      assert(
        !isNaN(numCssRulesAfterInsert),
        "StyleElement(#__FRSH_TWIND) is no exists"
      );

      const hasClassAfterInsert = await page.$eval(
        "#currentNumCssRules",
        (el) => {
          return Array.from(el.classList) as string[];
        }
      );

      const hasClassBeforeInsertSet = new Set(hasClassBeforeInsert);
      const addedClassArray = hasClassAfterInsert.filter((c) => {
        return !hasClassBeforeInsertSet.has(c);
      });

      const twindCssRulesAfterInsertSet = new Set(twindCssRulesAfterInsert);

      for (const addedClass of addedClassArray) {
        assert(
          twindCssRulesAfterInsertSet.has(`.${addedClass}`),
          `'${addedClass} has been inserted into a style sheet other than <style id="__FRSH_TWIND">'`
        );
      }

      // If twind in csr monitors <style id="__FRSH_TWIND"> ,the class just inserted will be compiled and the cssrule will increase.
      assert(
        numCssRulesBeforeInsert !== numCssRulesAfterInsert,
        'A cssrule has been inserted into a style sheet other than <style id="__FRSH_TWIND">'
      );
    }

    await page.goto("http://localhost:8000/insert-cssrules", {
      waitUntil: "networkidle2",
    });

    await t.step("Ensure ....", async () => {
      await DynamicallyInsertCssrulesTest();
    });

    await browser.close();

    await lines.cancel();
    serverProcess.kill("SIGTERM");
    serverProcess.close();
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
