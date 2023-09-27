import { defineApp } from "$fresh/src/server/defines.ts";

export default defineApp((res, ctx) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>test</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        <ctx.Component />
      </body>
    </html>
  );
});
