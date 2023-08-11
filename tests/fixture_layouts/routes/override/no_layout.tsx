import { LayoutConfig } from "$fresh/server.ts";

export const config: LayoutConfig = {
  inheritLayouts: false,
};

export default function OverridePage() {
  return (
    <p class="no-layouts">
      no layouts
    </p>
  );
}
