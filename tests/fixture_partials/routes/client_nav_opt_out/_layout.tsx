import { AppProps } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";
import { Fader } from "../../islands/Fader.tsx";

export default function AppLayout({ Component }: AppProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>fresh title</title>
      </head>
      <body f-client-nav={false}>
        <Partial name="body">
          <Fader>
            <Component />
          </Fader>
        </Partial>
        <p>
          <a
            class="page-a-link"
            href="/client_nav_opt_out/page-a"
          >
            Page A
          </a>
        </p>
        <p>
          <a
            class="page-b-link"
            href="/client_nav_opt_out/page-b"
          >
            Page B
          </a>
        </p>
        <p>
          <a
            class="page-c-link"
            href="/client_nav_opt_out/page-c"
          >
            Page C
          </a>
        </p>

        <pre id="logs" />
      </body>
    </html>
  );
}
