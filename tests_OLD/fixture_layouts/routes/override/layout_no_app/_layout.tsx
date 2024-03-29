import type { LayoutConfig, PageProps } from "$fresh/server.ts";

export const config: LayoutConfig = {
  skipAppWrapper: true,
};

export default function OverrideLayout({ Component }: PageProps) {
  return (
    <div class="no-app-layout">
      <Component />
    </div>
  );
}
