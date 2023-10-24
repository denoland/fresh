import { AppProps, Handler } from "$fresh/server.ts";

export const handler: Handler = (_req, ctx) => {
  ctx.state.lang = "de";
  return ctx.render();
};

export default function App(
  { Component, state }: AppProps<unknown, { lang: string }>,
) {
  return (
    <html lang={state.lang} class="html">
      <head class="head">
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>fresh title</title>
      </head>
      <body class="body">
        <div class="inner-body">
          <Component />
        </div>
      </body>
    </html>
  );
}
