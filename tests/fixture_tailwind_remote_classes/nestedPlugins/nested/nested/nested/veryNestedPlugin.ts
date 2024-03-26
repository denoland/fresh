import { normalize } from "$std/url/normalize.ts";
import type { Plugin } from "../../../../../../src/server/types.ts";
import VeryNestedPluginComponent from "../../../../components/VeryNestedPluginComponent.tsx";

export const veryNestedPlugin = {
  name: "very nested plugin",
  location: import.meta.url,
  projectLocation: normalize(import.meta.url + "../../../../../../").href,
  routes: [{
    path: "routeFromVeryNestedPlugin",
    component: VeryNestedPluginComponent,
  }],
} satisfies Plugin;
