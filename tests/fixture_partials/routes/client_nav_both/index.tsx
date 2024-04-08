import { Partial } from "$fresh/runtime.ts";
import { RouteConfig } from "$fresh/server.ts";
import CounterA from "../../islands/CounterA.tsx";
import { Fader } from "../../islands/Fader.tsx";

export const config: RouteConfig = {
  skipAppWrapper: true,
};

export default function ModeDemo() {
  return (
    <div>
      <Partial name="slot-1">
        <Fader>
          <p class="status-initial">Initial content</p>
          <CounterA />
        </Fader>
      </Partial>
    </div>
  );
}
