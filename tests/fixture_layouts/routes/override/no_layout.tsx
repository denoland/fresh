import { RouteConfig } from "$fresh/server.ts";

export const config: RouteConfig = {
  rootLayout: true,
};

export default function OverridePage() {
  return (
    <p class="no-layouts">
      no layouts
    </p>
  );
}
