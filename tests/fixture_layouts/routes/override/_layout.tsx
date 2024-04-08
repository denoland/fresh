import { LayoutConfig, PageProps } from "$fresh/server.ts";

export const config: LayoutConfig = {
  skipInheritedLayouts: true,
};

export default function OverrideLayout({ Component }: PageProps) {
  return (
    <div class="override-layout">
      <Component />
    </div>
  );
}
