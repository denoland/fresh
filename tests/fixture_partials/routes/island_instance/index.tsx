import { Partial } from "$fresh/runtime.ts";
import CounterA from "../../islands/CounterA.tsx";
import { Fader } from "../../islands/Fader.tsx";

export default function SlotDemo() {
  return (
    <div>
      <Partial name="slot-1">
        <Fader>
          <p>Initial content</p>
          <CounterA />
        </Fader>
      </Partial>
      <p>
        <a
          class="update-link"
          href="/island_instance/injected"
          f-partial="/island_instance/partial"
        >
          Update
        </a>
      </p>
      <p>
        <a
          class="remove-link"
          href="/island_instance/injected"
          f-partial="/island_instance/partial_remove"
        >
          Remove
        </a>
      </p>
      <p>
        <a
          class="replace-link"
          href="/island_instance/injected"
          f-partial="/island_instance/partial_replace"
        >
          Replace
        </a>
      </p>
      <pre id="logs" />
    </div>
  );
}
