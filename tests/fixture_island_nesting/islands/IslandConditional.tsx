import type { Signal } from "@preact/signals";
import type { ComponentChildren } from "preact";

export interface IslandConditionalProps {
  show: Signal<boolean>;
  children?: ComponentChildren;
}

export default function IslandConditional(
  { show, children }: IslandConditionalProps,
) {
  return (
    <div class="island">
      {show.value ? <p>island content</p> : <>{children}</>}
    </div>
  );
}
