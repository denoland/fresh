import { PageProps } from "$fresh/server.ts";

export default function FooLayout({ Component }: PageProps) {
  return (
    <div>
      <p class="foo-layout">Foo layout</p>
      <Component />
    </div>
  );
}
