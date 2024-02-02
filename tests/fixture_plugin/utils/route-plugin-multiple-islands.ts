import { FreshContext, Plugin } from "$fresh/server.ts";
import { handler as testMiddleware } from "./sample_routes/_middleware.ts";
import { AppBuilder } from "./sample_routes/AppBuilder.tsx";
import IslandsPluginComponent from "./sample_routes/PluginRouteWithIslands.tsx";
import { SimpleRoute } from "./sample_routes/simple-route.tsx";
import AsyncRoute from "./sample_routes/async-route.tsx";
import { PluginMiddlewareState } from "$fresh/tests/fixture_plugin/utils/route-plugin.ts";
export type { Options };

interface Options {
  title: string;
  async: boolean;
}

const twoPointlessMiddlewares = [
  async (_req: Request, ctx: FreshContext<PluginMiddlewareState>) => {
    ctx.state.num = ctx.state.num === undefined ? 1 : ctx.state.num + 1;
    return await ctx.next();
  },
  async (_req: Request, ctx: FreshContext<PluginMiddlewareState>) => {
    ctx.state.num = ctx.state.num === undefined ? 1 : ctx.state.num + 1;
    return await ctx.next();
  },
];

export default function routePluginMultipleIslands(
  options: Options,
): Plugin<PluginMiddlewareState> {
  return {
    name: "routePluginMultipleIslands",
    routes: [
      {
        path: "pluginroutewithislands",
        component: IslandsPluginComponent,
      },
    ],
    islands: [
      {
        baseLocation: import.meta.url,
        paths: ["./sample_islands/IslandFromPlugin.tsx"],
      },
      {
        baseLocation: import.meta.resolve(
          "./sample_islands/sub/Island2FromPlugin.tsx",
        ),
        paths: ["./Island2FromPlugin.tsx"],
      },
    ],
  };
}
