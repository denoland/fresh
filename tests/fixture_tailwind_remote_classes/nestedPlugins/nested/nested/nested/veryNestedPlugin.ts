import type { Plugin } from "../../../../../../src/server/types.ts";
import VeryNestedPluginComponent from "../../../../components/VeryNestedPluginComponent.tsx";

const currentUrl = new URL(import.meta.url);
currentUrl.pathname = currentUrl.pathname.split("/").slice(0, -5).join("/") +
  "/";

export const veryNestedPlugin = {
  name: "very nested plugin",
  location: import.meta.url,
  projectLocation: currentUrl.href,
  routes: [{
    path: "routeFromVeryNestedPlugin",
    handler: (_req, ctx) => {
      return ctx.render();
    },
    component: VeryNestedPluginComponent,
  }],
} satisfies Plugin;
