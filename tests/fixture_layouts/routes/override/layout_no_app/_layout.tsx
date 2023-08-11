import { LayoutConfig, LayoutProps } from "$fresh/server.ts";

export const config: LayoutConfig = {
  appTemplate: false,
};

export default function OverrideLayout({ Component }: LayoutProps) {
  return (
    <div class="no-app-layout">
      <Component />
    </div>
  );
}
