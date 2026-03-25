/**
 * Example of external Fresh Island component.
 *
 * @example
 * ```tsx
 * import { App } from "fresh";
 * import { DemoIsland } from "jsr:@fresh/examples/island";
 *
 * const app = new App();
 *
 * // Use the island somewhere in your components
 * app.get("/", (ctx) => ctx.render(<DemoIsland />));
 * ```
 *
 * @module
 */

import { useSignal } from "@preact/signals";
import type { JSX } from "preact";

/** A simple counter demo island component using Preact signals */
export function DemoIsland(): JSX.Element {
  const count = useSignal(0);

  return (
    <div style="display: flex; gap: 1rem; padding: 2rem;">
      <button type="button" onClick={() => (count.value -= 1)}>-1</button>
      <p style="font-variant-numeric: tabular-nums;">{count}</p>
      <button type="button" onClick={() => (count.value += 1)}>+1</button>
    </div>
  );
}
