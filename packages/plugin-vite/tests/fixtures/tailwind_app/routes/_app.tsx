import type { PageProps } from "@fresh/core";

export default function App(props: PageProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
      </head>
      <body>
        <props.Component />
      </body>
    </html>
  );
}
