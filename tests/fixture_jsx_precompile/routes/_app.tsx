import { defineApp } from "$fresh/src/server/defines.ts";

export default defineApp((req, ctx) => {
  // do something with state here
  return (
    <html class="foo">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My Fresh app</title>
        <meta key="foo" name="foo" content="bar" />
        <style>{`h1 {color: red }`}</style>
      </head>
      <body f-client-nav>
        <a href="/foo" f-client-nav class="link">link</a>
        <ctx.Component />
      </body>
    </html>
  );
});
