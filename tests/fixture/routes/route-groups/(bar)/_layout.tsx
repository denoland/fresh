import { PageProps } from "$fresh/server.ts";

export default function BarLayout({ Component }: PageProps) {
  return (
    <div>
      <p class="bar-layout">Bar layout</p>
      <Component />
    </div>
  );
}
