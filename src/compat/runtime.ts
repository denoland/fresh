import { type ComponentChildren, Fragment, h } from "preact";
export { asset } from "../runtime/shared.ts";

/**
 * @deprecated FIXME explain why + link to docs
 */
export function Head({ children }: { children: ComponentChildren }) {
  return h(Fragment, null, children);
}
