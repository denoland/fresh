import { AppProps, Handler, RouteContext } from "$fresh/server.ts";
import { delay } from "$std/async/delay.ts";

export const handler: Handler = (_req, ctx) => {
  ctx.state.lang = "de";
  return ctx.render();
};

export default async function App(
  req: Request,
  ctx: RouteContext,
  { Component, state }: AppProps<unknown, { lang: string }>,
) {
  await delay(100);

  return (
    <html lang={state.lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>fresh title</title>
      </head>
      <body>
        <div class="app">
          App template
          <Component />
        </div>
      </body>
    </html>
  );
}
