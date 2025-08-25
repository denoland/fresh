import type { PageProps } from "@fresh/core";

export default function Page({ Component }: PageProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>not ok</title>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
