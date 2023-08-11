import { LayoutConfig, LayoutProps } from "$fresh/server.ts";

export const config: LayoutConfig = {
  inheritLayouts: false,
};

export default function OverrideLayout({ Component }: LayoutProps) {
  return (
    <div class="override-layout">
      <Component />
    </div>
  );
}
