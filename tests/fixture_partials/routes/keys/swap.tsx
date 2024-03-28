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
        {[
          <Stateful key="C" id="C" />,
          <Stateful key="B" id="B" />,
          <Stateful key="A" id="A" />,
        ]}
      </Fader>
    </Partial>
  );
});
