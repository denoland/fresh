import { defineRoute } from "../../../../src/__OLD/server/defines.ts";
import type { RouteConfig } from "$fresh/server.ts";
import { Head, Partial } from "@fresh/runtime";
import { Fader } from "../../islands/Fader.tsx";

export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export default defineRoute((req, ctx) => {
  return (
    <>
      <Head>
        <link rel="stylesheet" href="/style.css" />
      </Head>
      <Partial name="slot-1">
        <Fader>
          <p class="page-without-title">page without title</p>
        </Fader>
      </Partial>
    </>
  );
});
