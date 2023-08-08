import { h } from "preact";
import { LayoutProps } from "$fresh/server.ts";

export default function TsLayout({ Component }: LayoutProps) {
  return h("div", { class: "ts-layout" }, h(Component, null));
}
