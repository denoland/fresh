import { Plugin } from "$fresh/server.ts";
import IslandsPluginComponent from "./sample_routes/PluginRouteWithIslands.tsx";
import { PluginMiddlewareState } from "$fresh/tests/fixture_plugin/utils/route-plugin.ts";

export default function routePluginMultipleIslands(): Plugin<
  PluginMiddlewareState
> {
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
