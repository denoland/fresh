import type { PageProps } from "$fresh/server.ts";
import { FreshScripts } from "@fresh/core";
import { asset } from "../../src/runtime/client/mod.tsx";

export default function App(
  { Component, ...rest }: PageProps<
    {
      headTitle: string;
      headDescription: string;
      headViewTransition: boolean;
      docStyleSheet: string;
    }
  >,
) {
  const title = rest.data.headTitle;
  const description = rest.data.headDescription;
  const headOgImg = new URL(asset("/home-og.png"), rest.url).href;
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        {description ? <meta name="description" content={description} /> : null}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={rest.url.href} />
        <meta property="og:image" content={headOgImg} />
        {rest.data.headViewTransition
          ? <meta name="view-transition" content="same-origin" />
          : null}
        <link rel="stylesheet" href="/styles.css" />
        {rest.data.docStyleSheet
          ? <link rel="stylesheet" href={rest.data.docStyleSheet} />
          : null}
      </head>
      <body>
        <Component />
        <FreshScripts />
      </body>
    </html>
  );
}
