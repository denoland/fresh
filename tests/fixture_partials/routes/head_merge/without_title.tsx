import { defineRoute } from "$fresh/src/server/defines.ts";
import { RouteConfig } from "$fresh/server.ts";
import { Head, Partial } from "$fresh/runtime.ts";
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
