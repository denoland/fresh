import { ComponentChildren, VNode } from "preact";

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
