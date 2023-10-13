import { defineRoute } from "$fresh/src/server/defines.ts";
import { RouteConfig } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";
import { delay } from "../../../deps.ts";

export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export default defineRoute(async (req, ctx) => {
  // A bit of artificial delay to show the loader
  await delay(200);

  return (
    <Partial name="slot-1">
      <p class="status-updated">it works</p>
    </Partial>
  );
});
