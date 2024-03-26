import { normalize } from "$std/url/normalize.ts";
import type { Plugin } from "../../../src/server/types.ts";
import NestedPluginComponent from "../components/NestedPluginComponent.tsx";
import AtPluginComponent from "@vscode_787_hack/components/AtPluginComponent.tsx";

export const nestedPlugin = {
  name: "nested plugin",
  location: import.meta.url,
  projectLocation: normalize(import.meta.url + "../../../").href,
  routes: [{
    path: "routeFromNestedPlugin",
    component: NestedPluginComponent,
  }, {
    path: "atRouteFromNestedPlugin",
    component: AtPluginComponent,
  }],
} satisfies Plugin;
