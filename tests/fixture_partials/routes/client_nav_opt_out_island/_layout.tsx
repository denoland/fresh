import { PageProps } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";
import { Fader } from "../../islands/Fader.tsx";

export default function AppLayout({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>fresh title</title>
      </head>
      <body f-client-nav>
        <Partial name="body">
          <Fader>
            <Component />
          </Fader>
        </Partial>
        <pre id="logs" />
      </body>
    </html>
  );
}
