import { Partial } from "$fresh/runtime.ts";
import { Fader } from "../../islands/Fader.tsx";
import Stateful from "../../islands/Stateful.tsx";

export default function SlotDemo() {
  return (
    <div>
      <Partial name="slot-1">
        <Fader>
          <p>Initial content</p>
          <ul>
            {[
              <li key="A" class="list-A">
                <Stateful id="A" />
              </li>,
              <li key="B" class="list-B">
                <Stateful id="B" />
              </li>,
              <li key="C" class="list-C">
                <Stateful id="C" />
              </li>,
            ]}
          </ul>
        </Fader>
      </Partial>
      <p>
        <a
          class="swap-link"
          href="/keys_dom/injected"
          f-partial="/keys_dom/swap"
        >
          swap
        </a>
      </p>
    </div>
  );
}
