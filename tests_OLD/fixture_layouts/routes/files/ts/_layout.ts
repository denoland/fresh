import { h } from "preact";
import type { PageProps } from "$fresh/server.ts";

export default function TsLayout({ Component }: PageProps) {
  return h("div", { class: "ts-layout" }, h(Component, null));
}
