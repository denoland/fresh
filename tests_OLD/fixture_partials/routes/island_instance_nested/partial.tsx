import { defineRoute } from "../../../../src/__OLD/server/defines.ts";
import type { RouteConfig } from "$fresh/server.ts";
import { Partial } from "@fresh/runtime";
import CounterA from "../../islands/CounterA.tsx";
import CounterB from "../../islands/CounterB.tsx";
import PassThrough from "../../islands/PassThrough.tsx";

export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export default defineRoute((req, ctx) => {
  return (
    <Partial name="slot-1">
      <PassThrough>
        <div class="inner">
          <p class="status-a">updated server content</p>
          <CounterA />
        </div>
        <hr />
        <PassThrough>
          <p class="status-b">another pass through</p>
          <CounterB />
        </PassThrough>
      </PassThrough>
    </Partial>
  );
});
