import type { PageProps } from "$fresh/server.ts";

export default function RootLayout(
  { Component }: PageProps<unknown>,
) {
  return (
    <div class="root-layout">
      <Component />
    </div>
  );
}
