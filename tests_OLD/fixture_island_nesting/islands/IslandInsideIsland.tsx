import type { ComponentChildren } from "preact";
import Island from "./Island.tsx";

export default function IslandInsideIsland(
  props: { children?: ComponentChildren },
) {
  return (
    <div class="island">
      <Island>
        {props.children}
      </Island>
    </div>
  );
}
