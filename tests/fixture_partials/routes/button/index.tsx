import { Partial } from "$fresh/runtime.ts";
import { Fader } from "../../islands/Fader.tsx";

export default function ModeDemo() {
  return (
    <div f-client-nav>
      <Partial name="body">
        <Fader>
          <p class="status-initial">Initial content</p>
        </Fader>
      </Partial>
      <p>
        <button f-partial="/button/update">
          update
        </button>
      </p>
    </div>
  );
}
