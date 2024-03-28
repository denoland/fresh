import { defineRoute } from "../../../../src/__OLD/server/defines.ts";
import type { RouteConfig } from "$fresh/server.ts";
import { Partial } from "@fresh/runtime";
import { Inner } from "./index.tsx";
import { Fader } from "../../islands/Fader.tsx";
import { Logger } from "../../islands/Logger.tsx";

export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export default defineRoute(() => (
  <div>
    <div>
      <Partial name="outer">
        <Logger name="outer">
          <Fader>
            <p class="status-outer">updated outer</p>

            <Inner />
          </Fader>
        </Logger>
      </Partial>
    </div>
  </div>
));
