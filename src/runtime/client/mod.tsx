import "../dev.ts";
import { type ComponentChildren, type VNode } from "preact";
export { IS_BROWSER } from "../shared.ts";
export { boot, revive } from "./reviver.ts";

// FIXME: Export asset functions

export function asset(src: string): string {
  // FIXME
  return src;
}

export interface PartialProps {
  children?: ComponentChildren;
  /**
   * The name of the partial. This value must be unique across partials.
   */
  name: string;
  /**
   * Define how the new HTML should be applied.
   * @default {"replace"}
   */
  mode?: "replace" | "prepend" | "append";
}

export function Partial(props: PartialProps): VNode {
  // deno-lint-ignore no-explicit-any
  return props.children as any;
}
Partial.displayName = "Partial";
