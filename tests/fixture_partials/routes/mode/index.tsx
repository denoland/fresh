import { Partial } from "$fresh/runtime.ts";
import CounterA from "../../islands/CounterA.tsx";
import { Fader } from "../../islands/Fader.tsx";

export default function ModeDemo() {
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
          class="replace-link"
          href="/mode/injected"
          f-partial="/mode/replace"
        >
          replace
        </a>
      </p>
      <p>
        <a
          class="append-link"
          href="/mode/injected"
          f-partial="/mode/append"
        >
          append
        </a>
      </p>
      <p>
        <a
          class="prepend-link"
          href="/mode/injected"
          f-partial="/mode/prepend"
        >
          prepend
        </a>
      </p>

      <pre id="logs" />
    </div>
  );
}
