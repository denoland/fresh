import { defineApp } from "$fresh/src/server/defines.ts";

export default defineApp((res, ctx) => {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <title>test</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body f-client-nav>
        <ctx.Component />
      </body>
    </html>
  );
});
