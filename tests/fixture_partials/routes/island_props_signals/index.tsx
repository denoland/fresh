import { Partial } from "$fresh/runtime.ts";
import { useSignal } from "@preact/signals";
import { Fader } from "../../islands/Fader.tsx";
import SignalProp from "../../islands/SignalProp.tsx";

export default function PropsDemo() {
  const sig = useSignal(0);

  return (
    <div>
      <Partial name="slot-1">
        <Fader>
          <p class="status-initial">initial</p>
          <SignalProp
            sig={sig}
          />
        </Fader>
      </Partial>
      <p>
        <a
          class="update-link"
          href="/island_props_signals/injected"
          f-partial="/island_props_signals/partial"
        >
          Update
        </a>
      </p>
    </div>
  );
}
