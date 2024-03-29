import type { PageProps } from "$fresh/server.ts";

export default function BarLayout({ Component }: PageProps) {
  return (
    <div>
      <p class="baz-layout">Baz layout</p>
      <Component />
    </div>
  );
}
