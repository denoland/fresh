import { Partial } from "$fresh/runtime.ts";
import { Fader } from "../../islands/Fader.tsx";
import PropIsland from "../../islands/PropIsland.tsx";

export default function PropsDemo() {
  return (
    <div>
      <Partial name="slot-1">
        <Fader>
          <p class="status-initial">initial</p>
          <PropIsland
            boolean={true}
            number={1}
            obj={{ foo: 123 }}
            strArr={["foo"]}
            string="foo"
          />
        </Fader>
      </Partial>
      <p>
        <a
          class="update-link"
          href="/island_props/injected"
          fh-partial="/island_props/partial"
        >
          Update
        </a>
      </p>
      <pre id="logs" />
    </div>
  );
}
