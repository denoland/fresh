import { defineRoute } from "$fresh/src/server/defines.ts";
import { RouteConfig } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";
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
