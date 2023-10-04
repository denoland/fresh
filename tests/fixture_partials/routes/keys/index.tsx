import { Partial } from "$fresh/runtime.ts";
import { Fader } from "../../islands/Fader.tsx";
import Stateful from "../../islands/Stateful.tsx";

export default function SlotDemo() {
  return (
    <div>
      <Partial name="slot-1">
        <Fader>
          <p>Initial content</p>
          {[
            <Stateful key="A" id="A" />,
            <Stateful key="B" id="B" />,
            <Stateful key="C" id="C" />,
          ]}
        </Fader>
      </Partial>
      <p>
        <a
          class="swap-link"
          href="/keys/injected"
          f-partial="/keys/swap"
        >
          swap
        </a>
      </p>
    </div>
  );
}
