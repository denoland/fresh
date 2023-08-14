import { LayoutConfig, LayoutProps } from "$fresh/server.ts";

export const config: LayoutConfig = {
  skipAppTemplate: false,
};

export default function OverrideLayout({ Component }: LayoutProps) {
  return (
    <div class="no-app-layout">
      <Component />
    </div>
  );
}
