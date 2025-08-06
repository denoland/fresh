import type { ComponentChildren, VNode } from "preact";
import { BUILD_ID } from "@fresh/build-id";
import { assetInternal, assetSrcSetInternal } from "./shared_internal.tsx";

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

/**
 * Create a "locked" asset path. This differs from a plain path in that it is
 * specific to the current version of the application, and as such can be safely
 * served with a very long cache lifetime (1 year).
 */
export function asset(path: string): string {
  return assetInternal(path, BUILD_ID);
}

/** Apply the `asset` function to urls in a `srcset` attribute. */
export function assetSrcSet(srcset: string): string {
  return assetSrcSetInternal(srcset, BUILD_ID);
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
