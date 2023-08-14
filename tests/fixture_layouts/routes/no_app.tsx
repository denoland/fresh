import { RouteConfig } from "$fresh/server.ts";

export const config: RouteConfig = {
  skipAppTemplate: false,
};

export default function OverridePage() {
  return (
    <html>
      <body>
        <p class="no-app">
          no <pre>_app.tsx</pre> template
        </p>
      </body>
    </html>
  );
}
