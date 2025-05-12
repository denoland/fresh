import { App } from "../../../src/app.ts";

const app = new App({ staticDir: "./static" }).get(
  "/",
  (ctx) =>
    ctx.render(
      <html>
        <head>
          <meta charset="utf-8" />
          <title>foo</title>
        </head>
        <body>
          <div f-client-nav>
            <span f-client-nav={false}>
              <p>false</p>
            </span>
            <a href="/">Home</a>
            <img src="/foo.jpg" alt="" />
            <picture>
              <source src="/bar.jpg" />
            </picture>
          </div>
        </body>
      </html>,
    ),
);

const handler = app.handler();
const res = await handler(new Request("http://localhost/"));
// deno-lint-ignore no-console
console.log(await res.text());
