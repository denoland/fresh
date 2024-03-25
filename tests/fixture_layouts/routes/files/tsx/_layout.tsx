import { h } from "preact";
import { PageProps } from "$fresh/server.ts";

export default function TsxLayout({ Component }: PageProps) {
  return (
    <div class="tsx-layout">
      <Component />
    </div>
  );
}
