import {
  assert,
  assertStringIncludes,
  delay,
  puppeteer,
  TextLineStream,
} from "./deps.ts";

import { cmpCssRules } from "./fixture_twind/utils/utils.ts";

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

    async function noDuplicatesTest(
      twindStyleElemSelector: string,
      twindClaimedStyleElemSelector: string
    ) {
      const twindCssRuleList = await page.evaluate((selector) => {
        const elem = document.querySelector(selector) as HTMLStyleElement;
        return elem?.sheet?.cssRules;
      }, twindStyleElemSelector);

      if (twindCssRuleList == null) {
        assert(false, `StyleElement(${twindStyleElemSelector}) is no exists`);
      }

      const twindClaimedCssRuleList = await page.evaluate((selector) => {
        const elem = document.querySelector(selector) as HTMLStyleElement;
        return elem?.sheet?.cssRules;
      }, twindClaimedStyleElemSelector);

      if (twindClaimedCssRuleList == null) {
        // There is only one style element by twind.
        return;
      }

      const numDuplicates = cmpCssRules(
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
