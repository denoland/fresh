import type { FreshContext, Plugin } from "$fresh/server.ts";
import { handler as testMiddleware } from "./sample_routes/_middleware.ts";
import { AppBuilder } from "./sample_routes/AppBuilder.tsx";
import IslandPluginComponent from "./sample_routes/PluginRouteWithIsland.tsx";
import { SimpleRoute } from "./sample_routes/simple-route.tsx";
import AsyncRoute from "./sample_routes/async-route.tsx";
export type { Options };

interface Options {
  title: string;
  async: boolean;
}
export type PluginMiddlewareState = {
  num: number;
  test: string;
};

const twoPointlessMiddlewares = [
  async (
    _req: Request,
    ctx: FreshContext<PluginMiddlewareState>,
  ) => {
    ctx.state.num = ctx.state.num === undefined ? 1 : ctx.state.num + 1;
    return await ctx.next();
  },
  async (
    _req: Request,
    ctx: FreshContext<PluginMiddlewareState>,
  ) => {
    ctx.state.num = ctx.state.num === undefined ? 1 : ctx.state.num + 1;
    return await ctx.next();
  },
];

export default function routePlugin(
  options: Options,
): Plugin<PluginMiddlewareState> {
  return {
    name: "routePlugin",
    middlewares: [{
      middleware: { handler: testMiddleware },
      path: "/",
    }, {
      middleware: {
        handler: twoPointlessMiddlewares,
      },
      path: "lots-of-middleware",
    }],
    routes: [
      { path: "/async-route", component: AsyncRoute },
      {
        path: "/_app",
        component: AppBuilder(options),
      },
      { path: "no-leading-slash-here", component: SimpleRoute },
      {
        path: "pluginroutewithisland",
        component: IslandPluginComponent,
      },
    ],
    islands: {
      baseLocation: import.meta.url,
      paths: ["./sample_islands/IslandFromPlugin.tsx"],
    },
  };
}
