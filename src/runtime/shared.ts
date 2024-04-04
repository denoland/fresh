import type { ComponentChildren, VNode } from "preact";

export function asset(src: string): string {
  // FIXME
  return src;
}

/**
 * Returns true when the current runtime is the browser and false otherwise. This is used for guard runtime-dependent code.
 * Shorthand for the following:
 * `typeof document !== "undefined"`
 *
 * @example
 * ```
 *  if (IS_BROWSER) {
 *    alert('This is running in the browser!');
 *  } else {
 *    console.log('This code is running on the server, no access to window or alert');
 *  }
 * ```
 *
 * Without this guard, alert pauses the server until return is pressed in the console.
 */
export const IS_BROWSER = typeof document !== "undefined";

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
