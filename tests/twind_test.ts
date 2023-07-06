import { assert, delay, puppeteer } from "./deps.ts";

import { cmpStringArray } from "./fixture_twind_hydrate/utils/utils.ts";
import { startFreshServer, withPageName } from "./test_utils.ts";

/**
 * Start the server with the main file.
 *
 * Returns a page instance and a method to terminate the server.
 */
async function setUpServer(path: string) {
  const { lines, serverProcess, address } = await startFreshServer({
    args: ["run", "-A", path],
  });

  await delay(100);

  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();

  /**
   * terminate server
   */
  const terminate = async () => {
    await lines.cancel();
    await browser.close();

    serverProcess.kill("SIGKILL");
    await serverProcess.status;

    // TextDecoder leaks, so close it manually.
    const denoResourcesMap = new Map(
      Object.entries(Deno.resources()).map(([rid, representation]) => {
        return [representation, parseInt(rid)];
      }),
    );
    const textDecoderRid = denoResourcesMap.get("textDecoder");
    if (textDecoderRid != null) {
      Deno.close(textDecoderRid);
    }
  };

  return { page: page, terminate: terminate, address };
}

/**
 * Main file path
 */
const MAIN_FILE_PATH = "./tests/fixture_twind_hydrate/main.ts";

Deno.test({
  name: "twind static test",
  async fn(t) {
    // Preparation
    const server = await setUpServer(MAIN_FILE_PATH);
    const page = server.page;

    /**
     * Compare the class of element of any id with the selectorText of cssrules in stylesheet.
     * Ensure that twind compliles the class of element.
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
          `'${elemClass}' is not compiled by twind`,
        );
      }
    }

    await page.goto(`${server.address}/static`, {
      waitUntil: "networkidle2",
    });

    // For avoid leaking async ops.
    await delay(10);

    await t.step("Twind complies cssrules from dom class in ssr", async () => {
      await compiledCssRulesTest("helloTwind", "__FRSH_TWIND");
    });

    await server.terminate();
  },
});

Deno.test({
  name: "No duplicate twind cssrules",
  async fn(t) {
    // Preparation
    const server = await setUpServer(MAIN_FILE_PATH);
    const page = server.page;

    /**
     * Ensure that the cssrule of the two style elements specified do not duplicate.
     * PR946 fails and PR1050 passes.
     */
    async function noDuplicatesTest(
      twindStyleElemSelector: string,
      twindClaimedStyleElemSelector: string,
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
        twindClaimedCssRuleList,
      );

      assert(false, `${numDuplicates} cssrules are duplicated`);
    }

    await page.goto(`${server.address}/check-duplication`, {
      waitUntil: "networkidle2",
    });

    // For avoid leaking async ops.
    await delay(10);

    await t.step("Ensure no dupulicate twind cssrules in islands", async () => {
      await noDuplicatesTest(
        "#__FRSH_TWIND",
        '[data-twind="claimed"]:not(#__FRSH_TWIND)',
      );
    });

    await server.terminate();
  },
});

Deno.test({
  name: "Dynamically insert cssrules",
  async fn(t) {
    // Preparation
    const server = await setUpServer(MAIN_FILE_PATH);
    const page = server.page;

    /**
     * Ensure that the class dynamically inserted in islands is compiled by twind.
     * PR946 fails and PR1050 passes.
     */
    async function DynamicallyInsertCssrulesTest(twindStyleId: string) {
      const numCssRulesBeforeInsert = await page.$eval(
        `#${twindStyleId}`,
        (el) => {
          const styleElem = el as HTMLStyleElement;
          const cssRules = styleElem.sheet?.cssRules;
          const numCssRules = cssRules?.length;

          return numCssRules != null ? numCssRules : NaN;
        },
      );

      assert(
        !isNaN(numCssRulesBeforeInsert),
        "StyleElement(#${twindStyleId}) is no exists",
      );

      const classBeforeInsert = await page.$eval(
        "#currentNumCssRules",
        (el) => {
          return Array.from(el.classList) as string[];
        },
      );

      // After click, `text-green-600` is inserted to the class of the element in #currentNumCssRules.
      await page.$eval("#insertCssRuleButton", (el) => {
        return el.click();
      });

      const [numCssRulesAfterInsert, twindCssRulesAfterInsert] = await page
        .$eval(`#${twindStyleId}`, (el) => {
          const styleElem = el as HTMLStyleElement;
          const cssRules = styleElem.sheet?.cssRules;
          const numCssRules = cssRules?.length;
          const cssRulesSelectorTextArray = cssRules != null
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
        `StyleElement(#${twindStyleId}) is no exists`,
      );

      const classAfterInsert = await page.$eval("#currentNumCssRules", (el) => {
        return Array.from(el.classList) as string[];
      });

      const classBeforeInsertSet = new Set(classBeforeInsert);

      const dynInsertedClassArray = classAfterInsert.filter((c) => {
        return !classBeforeInsertSet.has(c);
      });

      // Check if the added class is compiled by twind.
      const twindCssRulesAfterInsertSet = new Set(twindCssRulesAfterInsert);
      for (const insertedClass of dynInsertedClassArray) {
        assert(
          twindCssRulesAfterInsertSet.has(`.${insertedClass}`),
          `'${insertedClass} has been inserted into a style sheet other than <style id="${twindStyleId}">'`,
        );
      }

      // If twind in csr monitors <style id="${twindStyleId}"> ,
      // the class(not compiled) just inserted will be compiled
      // and the cssrule will increase.
      assert(
        numCssRulesBeforeInsert !== numCssRulesAfterInsert,
        `Cssrule has been inserted into a style sheet other than <style id="${twindStyleId}"> or it was compiled at the time of SSR.`,
      );
    }

    await page.goto(`${server.address}/insert-cssrules`, {
      waitUntil: "networkidle2",
    });

    // For avoid leaking async ops.
    await delay(10);

    await t.step(
      "Ensure that the class dynamically inserted in islands is compiled",
      async () => {
        await DynamicallyInsertCssrulesTest("__FRSH_TWIND");
      },
    );

    await server.terminate();
  },
});

Deno.test({
  name: "Excludes classes from unused vnodes",
  async fn() {
    await withPageName(
      "./tests/fixture_twind_hydrate/main.ts",
      async (page, address) => {
        await page.goto(`${address}/unused`);
        await page.waitForSelector("#__FRSH_TWIND");

        const hasUnusedRules = await page.$eval("#__FRSH_TWIND", (el) => {
          return el.textContent.includes(".text-red-600");
        });
        assert(
          !hasUnusedRules,
          "Unused CSS class '.text-red-600' found.",
        );
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
