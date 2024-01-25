import type { Plugin } from "../../src/server/types.ts";
import JsxPluginComponent from "./components/JsxPluginComponent.jsx";

export const jsxPlugin = {
  name: "jsx plugin",
  routes: [
    {
      path: "routeFromJsxPlugin",
      handler: (_req, ctx) => {
        return ctx.render();
      },
      component: JsxPluginComponent,
    },
  ],
  location: import.meta.url,
} satisfies Plugin;
