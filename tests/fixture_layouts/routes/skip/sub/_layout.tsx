import { PageProps } from "$fresh/server.ts";

export default function SubLayout({ Component }: PageProps) {
  return (
    <div class="sub-layout">
      <Component />
    </div>
  );
}
