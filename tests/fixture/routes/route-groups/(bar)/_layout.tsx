import { LayoutProps } from "$fresh/server.ts";

export default function BarLayout({ Component }: LayoutProps) {
  return (
    <div>
      <p class="bar-layout">Bar layout</p>
      <Component />
    </div>
  );
}
