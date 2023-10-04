import { LayoutProps } from "$fresh/server.ts";

export default function RootLayout(
  { Component }: LayoutProps<unknown>,
) {
  return (
    <div class="root-layout">
      <Component />
    </div>
  );
}
