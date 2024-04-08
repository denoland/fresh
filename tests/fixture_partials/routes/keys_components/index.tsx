import { Partial } from "$fresh/runtime.ts";
import { Fader } from "../../islands/Fader.tsx";
import Stateful from "../../islands/Stateful.tsx";
import { Keyed } from "../../components/Keyed.tsx";

export default function SlotDemo() {
  return (
    <div>
      <Partial name="slot-1">
        <Fader>
          <p>Initial content</p>
          {[
            <Keyed key="A">
              <Stateful id="A" />
            </Keyed>,
            <Keyed key="B">
              <Stateful id="B" />
            </Keyed>,
            <Keyed key="C">
              <Stateful id="C" />
            </Keyed>,
          ]}
        </Fader>
      </Partial>
      <p>
        <a
          class="swap-link"
          href="/keys_components/injected"
          f-partial="/keys_components/swap"
        >
          swap
        </a>
      </p>
    </div>
  );
}
