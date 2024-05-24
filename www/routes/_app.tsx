import { asset } from "@fresh/core/runtime";
import { df } from "../utils/state.ts";

export default df.page(function App({ Component, state, url }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {state.title ? <title>{state.title}</title> : null}
        {state.description
          ? <meta name="description" content={state.description} />
          : null}
        {state.title
          ? <meta property="og:title" content={state.title} />
          : null}
        {state.description
          ? <meta property="og:description" content={state.description} />
          : null}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url.href} />
        {state.ogImage
          ? <meta property="og:image" content={state.ogImage} />
          : null}
        {state.noIndex ? <meta name="robots" content="noindex" /> : null}
        <link
          rel="preload"
          href={asset("/fonts/FixelVariable.woff2")}
          as="font"
          type="font/woff2"
          crossorigin="true"
        />
        <link rel="stylesheet" href={asset("/styles.css")} />
        {url.pathname === "/"
          ? <link rel="stylesheet" href={asset("/prism.css")} />
          : null}
        {url.pathname.startsWith("/docs/")
          ? (
            <>
              <link rel="stylesheet" href={asset("/docsearch.css")} />
              <link rel="stylesheet" href={asset("/markdown.css")} />
            </>
          )
          : null}
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
});
