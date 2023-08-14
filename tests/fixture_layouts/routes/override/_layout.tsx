import { LayoutConfig, LayoutProps } from "$fresh/server.ts";

export const config: LayoutConfig = {
  skipInheritedLayouts: true,
};

export default function OverrideLayout({ Component }: LayoutProps) {
  return (
    <div class="override-layout">
      <Component />
    </div>
  );
}
