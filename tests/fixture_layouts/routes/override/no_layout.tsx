import { LayoutConfig } from "$fresh/server.ts";

export const config: LayoutConfig = {
  skipInheritedLayouts: false,
};

export default function OverridePage() {
  return (
    <p class="no-layouts">
      no layouts
    </p>
  );
}
