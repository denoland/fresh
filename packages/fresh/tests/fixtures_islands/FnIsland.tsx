import type { VNode } from "preact";

import { FragmentIsland } from "./FragmentIsland.tsx";
import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";

function Foo(props: { children: () => VNode }) {
  return props.children();
}

export function FnIsland() {
  const active = useSignal(false);

  useEffect(() => {
    active.value = true;
  }, []);

  return (
    <div class={active.value ? "ready" : ""}>
      <Foo>
        {() => <FragmentIsland />}
      </Foo>
    </div>
  );
}
