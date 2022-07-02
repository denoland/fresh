/** @jsx h */
import { h } from "preact";
import { Body, Links, Meta, Scripts, Styles } from "$fresh/server.ts";

export default function Root({ lang }: { lang: string }) {
  return (
    <html lang={lang}>
      <head>
        <meta charSet="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <title>Hello from ./routes/_root.tsx</title>
        <Links />
        <Scripts />
        <Styles />
      </head>

      <Body />
    </html>
  );
}
