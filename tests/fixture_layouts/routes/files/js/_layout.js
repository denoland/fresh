import { h } from "preact";

export default function JsLayout({ Component }) {
  return h("div", { class: "js-layout" }, h(Component, null));
}
