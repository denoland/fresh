import { LayoutConfig } from "$fresh/server.ts";

export const config: LayoutConfig = {
  skipInheritedLayouts: true,
};

export default function OverridePage() {
  return (
    <p class="no-layouts">
      no layouts
    </p>
  );
}
