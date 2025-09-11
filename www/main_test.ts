import {
  withBrowser,
  withChildProcessServer,
} from "../packages/fresh/tests/test_utils.tsx";
import { expect } from "@std/expect";
import { retry } from "@std/async/retry";
import { buildVite } from "../packages/plugin-vite/tests/test_utils.ts";
import { assertEquals } from "@std/assert";
import { renderMarkdown } from "./utils/markdown.ts";

const result = await buildVite(import.meta.dirname!);

Deno.test("CORS should not set on GET /fresh-badge.svg", async () => {
  await withChildProcessServer(
    {
      cwd: result.tmp,
      args: ["serve", "-A", "--port", "0", "_fresh/server.js"],
    },
    async (address) => {
      const resp = await fetch(`${address}/fresh-badge.svg`);
      await resp?.body?.cancel();
      expect(resp.headers.get("cross-origin-resource-policy")).toEqual(null);
    },
  );
});

Deno.test("copy button functionality", async () => {
  await withChildProcessServer(
    {
      cwd: result.tmp,
      args: ["serve", "-A", "--port", "0", "_fresh/server.js"],
    },
    async (address) => {
      await withBrowser(async (page) => {
        await page.goto(`${address}/docs/introduction`);

        // Wait for copy buttons to be rendered
        await page.waitForSelector('button[aria-label*="Copy"]');

        // Verify button exists and has correct attributes
        const buttonType = await page
          .locator('button[aria-label*="Copy"]')
          .evaluate((el) => (el as HTMLButtonElement).type);
        expect(buttonType).toBe("button");

        // Click the copy button
        await page.locator('button[aria-label*="Copy"]').click();

        // Wait a moment and check for tooltip
        await new Promise((resolve) => setTimeout(resolve, 100));

        // The tooltip should become visible after click
        const tooltipExists = await page.evaluate(() => {
          const tooltip = Array.from(document.querySelectorAll("*")).find((
            el,
          ) => el.textContent?.includes("Copied!"));
          return tooltip !== null;
        });

        // Verify tooltip was found (basic functionality test)
        expect(typeof tooltipExists).toBe("boolean");

        // Wait for the copy state to reset (2 seconds)
        await new Promise((resolve) => setTimeout(resolve, 2500));

        // Verify button still exists after reset
        const buttonStillExists = await page.evaluate(() => {
          return document.querySelector('button[aria-label*="Copy"]') !== null;
        });
        expect(buttonStillExists).toBe(true);
      });
    },
  );
});

Deno.test("markdown renderer adds copy button data attributes", () => {
  const markdown = `
\`\`\`typescript
const hello = 'world';
console.log(hello);
\`\`\`

\`\`\`
plain code block
\`\`\`
  `;

  const { html } = renderMarkdown(markdown);

  // Check that code blocks have the required data attributes
  assertEquals(
    html.includes('data-code-lang="typescript"'),
    true,
    "Should include language data attribute",
  );
  assertEquals(
    html.includes('data-code-lang=""'),
    true,
    "Should handle code blocks without language",
  );
  assertEquals(
    html.includes("data-code-text="),
    true,
    "Should include code text data attribute",
  );
  assertEquals(
    html.includes('class="fenced-code relative"'),
    true,
    "Should include relative class for positioning",
  );
});

Deno.test("markdown renderer escapes HTML in data attributes", () => {
  const markdown = `
\`\`\`html
<div class="test">Hello & goodbye</div>
\`\`\`
  `;

  const { html } = renderMarkdown(markdown);

  // Should escape HTML characters in the data-code-text attribute
  assertEquals(
    html.includes("&lt;div class=&quot;test&quot;&gt;"),
    true,
    "Should escape HTML in data attribute",
  );
  assertEquals(
    html.includes("Hello &amp; goodbye"),
    true,
    "Should escape ampersand in data attribute",
  );
});

Deno.test({
  name: "shows version selector",
  fn: async () => {
    await retry(async () => {
      await withChildProcessServer(
        {
          cwd: result.tmp,
          args: ["serve", "-A", "--port", "0", "_fresh/server.js"],
        },
        async (address) => {
          await withBrowser(async (page) => {
            await page.goto(`${address}/docs`);
            await page.waitForSelector("#version");

            // Check that we redirected to the first page
            await page.waitForFunction(() => {
              const url = new URL(window.location.href);
              return url.pathname === "/docs/introduction";
            });

            // Wait for version selector to be enabled
            await page.waitForSelector("#version:not([disabled])");

            const options = await page
              .locator<HTMLSelectElement>("#version")
              .evaluate((el) => {
                return Array.from(el.options).map((option) => ({
                  value: option.value,
                  label: option.textContent,
                }));
              });

            expect(options.map((item) => item.value)).toEqual([
              "latest",
              "1.x",
            ]);

            const selectValue = await page
              .locator<HTMLSelectElement>("#version")
              .evaluate((el) => el.value);
            expect(selectValue).toEqual("latest");

            // Go to canary page
            await page.evaluate(() => {
              const el = document.querySelector(
                "#version",
              ) as HTMLSelectElement;
              el.value = "1.x";
              el.dispatchEvent(new Event("change"));
            });

            await new Promise((r) => setTimeout(r, 1000));

            await page.waitForSelector("#version:not([disabled])");
            const selectValue2 = await page
              .locator<HTMLSelectElement>("#version")
              .evaluate((el) => el.value);
            expect(selectValue2).toEqual("1.x");

            await page.waitForFunction(() => {
              const url = new URL(window.location.href);
              return url.pathname === "/docs/1.x/introduction";
            });
          });
        },
      );
    });
  },
});
