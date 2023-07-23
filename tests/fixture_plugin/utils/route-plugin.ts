import { Plugin } from "$fresh/server.ts";
import { handler as testMiddleware } from "./sample_routes/_middleware.ts";
import { AppBuilder } from "./sample_routes/AppBuilder.tsx";
import Home from "./sample_routes/PluginRouteWithIsland.tsx";
export type { Options };

interface Options {
  title: string;
}

export default function routePlugin(options: Options): Plugin {
  return {
    name: "routePlugin",
    middlewares: [{
      middleware: { handler: testMiddleware },
      path: "/",
    }],
    routes: [{
      path: "/_app",
      component: AppBuilder(options),
    }, {
      path: "/pluginroutewithisland",
      component: Home,
    }],
    islands: {
      baseLocation: import.meta.url,
      paths: ["./sample_islands/IslandFromPlugin.tsx"],
    },
  };
}
