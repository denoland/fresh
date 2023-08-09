import { RouteConfig } from "$fresh/server.ts";

export const config: RouteConfig = {
  appTemplate: false,
  rootLayout: true,
};

export default function OverridePage() {
  return (
    <p class="no-app-no-layouts">
      no <code>_app.tsx</code> template and no layouts
    </p>
  );
}
