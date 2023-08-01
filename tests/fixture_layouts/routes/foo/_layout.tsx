import { LayoutProps } from "$fresh/server.ts";

export default function FooLayout({ Component }: LayoutProps) {
  return (
    <div class="foo-layout">
      <Component />
    </div>
  );
}
