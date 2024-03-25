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
        <title>Head merge duplicated</title>
        <link rel="stylesheet" href="/style.css" />
        <style id="style-foo">{`p { color: green }`}</style>
      </Head>
      <Partial name="slot-1">
        <Fader>
          <h1>duplicated</h1>
          <p class="status-duplicated">duplicated content</p>
        </Fader>
      </Partial>
    </>
  );
});
