import { LayoutConfig } from "$fresh/server.ts";

export const config: LayoutConfig = {
  appTemplate: false,
  inheritLayouts: false,
};

export default function OverridePage() {
  return (
    <p class="no-app-no-layouts">
      no <code>_app.tsx</code> template and no layouts
    </p>
  );
}
