import { LayoutConfig } from "$fresh/server.ts";

export const config: LayoutConfig = {
  skipAppTemplate: false,
  skipInheritedLayouts: false,
};

export default function OverridePage() {
  return (
    <p class="no-app-no-layouts">
      no <code>_app.tsx</code> template and no layouts
    </p>
  );
}
