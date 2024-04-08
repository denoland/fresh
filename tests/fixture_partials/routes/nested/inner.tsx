import { defineRoute } from "$fresh/src/server/defines.ts";
import { RouteConfig } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";
import { Fader } from "../../islands/Fader.tsx";
import { Logger } from "../../islands/Logger.tsx";

export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export default defineRoute(() => (
  <div>
    <div>
      <Partial name="inner">
        <Logger name="inner">
          <Fader>
            <p class="status-inner">updated inner</p>
          </Fader>
        </Logger>
      </Partial>
    </div>
  </div>
));
