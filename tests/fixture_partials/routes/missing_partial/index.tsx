import { Partial } from "$fresh/runtime.ts";
import CounterA from "../../islands/CounterA.tsx";
import { Fader } from "../../islands/Fader.tsx";

export default function WarnDemo() {
  return (
    <div>
      <Partial name="slot-1">
        <Fader>
          <p class="status-initial">Initial content</p>
          <CounterA />
        </Fader>
      </Partial>
      <p>
        <a
          class="update-link"
          href="/missing_partial/injected"
          f-partial="/missing_partial/update"
        >
          update
        </a>
      </p>
    </div>
  );
}
