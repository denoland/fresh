import { defineRoute } from "../../../../src/__OLD/server/defines.ts";
import type { RouteConfig } from "$fresh/server.ts";
import { Partial } from "@fresh/runtime";
import { Fader } from "../../islands/Fader.tsx";
import SignalProp from "../../islands/SignalProp.tsx";
import { signal } from "@preact/signals";

export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export default defineRoute((req, ctx) => {
  const sig = signal(0);
  return (
    <Partial name="slot-1">
      <Fader>
        <p class="status-update">update</p>
        <SignalProp sig={sig} />
      </Fader>
    </Partial>
  );
});
