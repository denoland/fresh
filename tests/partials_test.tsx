import type { ComponentChildren } from "preact";
import { FreshApp, FreshScripts, freshStaticFiles } from "@fresh/core";
import { Partial } from "@fresh/core/runtime";
import { waitForText, withBrowserApp } from "./test_utils.ts";

function Doc(props: { children?: ComponentChildren }) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Test</title>
      </head>
      <body>
        {props.children}
        <FreshScripts />
      </body>
    </html>
  );
}

// TODO
Deno.test.ignore("partials - updates content", async () => {
  const app = new FreshApp()
    .use(freshStaticFiles())
    .get("/partial", (ctx) => {
      return ctx.render(
        <Partial name="foo">
          <p class="output">partial update</p>
        </Partial>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <a href="/partial" class="update">update</a>
            <Partial name="foo">
              <p class="output">hello world</p>
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.click(".update");
    await new Promise((r) => setTimeout(r, 10000000));
    await waitForText(page, ".output", "partial update");
  });
});
