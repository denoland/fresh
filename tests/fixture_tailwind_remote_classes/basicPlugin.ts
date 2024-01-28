import type { Plugin } from "../../src/server/types.ts";
import PluginComponent from "./components/PluginComponent.tsx";

export const basicPlugin = {
  name: "basic plugin",
  routes: [
    {
      path: "routeFromPlugin",
      component: PluginComponent,
    },
  ],
  location: import.meta.url,
} satisfies Plugin;
