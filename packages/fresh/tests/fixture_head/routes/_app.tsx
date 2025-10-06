import type { PageProps } from "@fresh/core";

export default function Page({ Component }: PageProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>not ok</title>
        <meta name="foo" content="not ok" />
        <meta name="bar" content="not ok" />
        <style>not ok</style>
        <style id="style-id">not ok</style>
        <template key="a">not ok</template>
        <template key="b">not ok</template>
        <template>not ok</template>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
