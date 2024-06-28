import type { ComponentChildren } from "preact";

export function Doc(props: { children?: ComponentChildren }) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Finish setting up Fresh</title>
      </head>
      <body>{props.children}</body>
    </html>
  );
}
