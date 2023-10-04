import { Partial } from "$fresh/runtime.ts";
import { Fader } from "../../islands/Fader.tsx";
import { Logger } from "../../islands/Logger.tsx";

export default function SlotDemo() {
  return (
    <div>
      <Partial name="slot-1">
        <Logger name="slot-1">
          <Fader>
            <p class="status">initial</p>
          </Fader>
        </Logger>
      </Partial>
      <p>
        <a
          class="update-link"
          href="/deep_partial/injected"
          f-partial="/deep_partial/update"
        >
          update
        </a>
      </p>
      <pre id="logs" />
    </div>
  );
}
