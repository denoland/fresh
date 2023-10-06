import { AppProps } from "$fresh/server.ts";

export default function App({ Component }: AppProps) {
  return (
    <html className="bg-slate-800">
      <head className="bg-slate-800">
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>fresh-foo</title>
      </head>
      <body className="bg-slate-800">
        <Component />
      </body>
    </html>
  );
}
