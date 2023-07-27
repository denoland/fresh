import { LayoutProps } from "$fresh/server.ts";

export default function SubLayout({ Component }: LayoutProps) {
  return (
    <div class="sub-layout">
      <Component />
    </div>
  );
}
