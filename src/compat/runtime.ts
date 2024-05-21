import { type ComponentChildren, Fragment, h, type VNode } from "preact";

/**
 * @deprecated FIXME explain why + link to docs
 */
export function Head({ children }: { children: ComponentChildren }): VNode {
  return h(Fragment, null, children);
}
