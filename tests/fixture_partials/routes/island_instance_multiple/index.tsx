import { Partial } from "$fresh/runtime.ts";
import CounterA from "../../islands/CounterA.tsx";
import CounterB from "../../islands/CounterB.tsx";
import { Fader } from "../../islands/Fader.tsx";

export default function SlotDemo() {
  return (
    <div>
      <div id="output">
        <Partial name="slot-1">
          <Fader>
            <p>Initial content slot 1</p>
            <CounterA />
          </Fader>
        </Partial>
        <hr />
        <Partial name="slot-2">
          <Fader>
            <p>Initial content slot 2</p>
            <CounterB />
          </Fader>
        </Partial>
        <hr />
      </div>
      <p>
        <a
          class="update-second-link"
          href="/island_instance_multiple/injected"
          f-partial="/island_instance_multiple/partial"
        >
          update second
        </a>
      </p>
      <p>
        <a
          class="update-both-link"
          href="/island_instance_multiple/injected"
          f-partial="/island_instance_multiple/partial_both"
        >
          update both
        </a>
      </p>
      <pre id="logs" />
    </div>
  );
}
