import { defineRoute } from "../../../../src/__OLD/server/defines.ts";
import type { RouteConfig } from "$fresh/server.ts";
import { Partial } from "@fresh/runtime";
import { Fader } from "../../islands/Fader.tsx";
import Stateful from "../../islands/Stateful.tsx";

export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export default defineRoute((req, ctx) => {
  return (
    <Partial name="slot-1">
      <Fader>
        <p class="status-swap">swapped content</p>
        <ul>
          {[
            <li key="C" class="list-C">
              <Stateful id="C" />
            </li>,
            <li key="B" class="list-B">
              <Stateful id="B" />
            </li>,
            <li key="A" class="list-A">
              <Stateful id="A" />
            </li>,
          ]}
        </ul>
      </Fader>
    </Partial>
  );
});
