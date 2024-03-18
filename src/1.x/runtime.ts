import { ComponentChildren, Fragment, h } from "preact";
export { asset } from "@fresh/runtime";

/**
 * @deprecated FIXME explain why + link to docs
 */
export function Head({ children }: { children: ComponentChildren }) {
  return h(Fragment, null, children);
}
