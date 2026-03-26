import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import type { ComponentChildren } from "preact";

export interface JsxIslandProps {
  children?: ComponentChildren;
}

export function JsxChildrenIsland(props: JsxIslandProps) {
  const active = useSignal(false);

  useEffect(() => {
    active.value = true;
  }, []);

  return (
    <div class={active.value ? "ready" : ""}>
      <div class="children">{props.children}</div>
      {active.value ? <div class="after">{props.children}</div> : null}
    </div>
  );
}
