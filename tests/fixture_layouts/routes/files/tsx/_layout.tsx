import { h } from "preact";
import { LayoutProps } from "$fresh/server.ts";

export default function TsxLayout({ Component }: LayoutProps) {
  return (
    <div class="tsx-layout">
      <Component />
    </div>
  );
}
