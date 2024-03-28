import { defineRoute } from "../../../../src/__OLD/server/defines.ts";
import type { RouteConfig } from "$fresh/server.ts";
import { Partial } from "@fresh/runtime";
import { Fader } from "../../islands/Fader.tsx";
import { Logger } from "../../islands/Logger.tsx";

export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export default defineRoute((req, ctx) => {
  return (
    <div>
      <div>
        <Partial name="slot-1">
          <Logger name="slot-1">
            <Fader>
              <p class="status-updated">updated</p>
            </Fader>
          </Logger>
        </Partial>
      </div>
    </div>
  );
});
