import { upNLevels } from "$fresh/plugins/tailwind.ts";
import type { Plugin } from "../../../../../../src/server/types.ts";
import VeryNestedPluginComponent from "../../../../components/VeryNestedPluginComponent.tsx";

export const veryNestedPlugin = {
  name: "very nested plugin",
  location: import.meta.url,
  projectLocation: upNLevels(import.meta.url, 5),
  routes: [{
    path: "routeFromVeryNestedPlugin",
    component: VeryNestedPluginComponent,
  }],
} satisfies Plugin;
