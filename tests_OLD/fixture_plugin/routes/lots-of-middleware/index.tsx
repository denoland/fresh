import type { Handlers, PageProps } from "$fresh/server.ts";
import type { PluginMiddlewareState } from "../../utils/route-plugin.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const resp = await ctx.render();
    return resp;
  },
};

export default function Home(props: PageProps<unknown, PluginMiddlewareState>) {
  const value = props.state.num;
  return (
    <div>
      <h1>{value}</h1>
    </div>
  );
}
