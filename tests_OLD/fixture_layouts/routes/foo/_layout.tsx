import type { PageProps } from "$fresh/server.ts";

export default function FooLayout({ Component }: PageProps) {
  return (
    <div class="foo-layout">
      <Component />
    </div>
  );
}
