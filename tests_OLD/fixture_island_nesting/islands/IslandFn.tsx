import type { VNode } from "preact";

import FragmentIsland from "./FragmentIsland.tsx";

function Foo(props: { children: () => VNode }) {
  return props.children();
}

export default function IslandFn() {
  return (
    <div class="island">
      <Foo>
        {() => <FragmentIsland />}
      </Foo>
    </div>
  );
}
