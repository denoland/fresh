import { LayoutProps, RouteConfig } from "$fresh/server.ts";

export const config: RouteConfig = {
  rootLayout: true,
};

export default function OverrideLayout({ Component }: LayoutProps) {
  return (
    <div class="override-layout">
      <Component />
    </div>
  );
}
