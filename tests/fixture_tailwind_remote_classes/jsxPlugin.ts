import type { Plugin } from "../../src/server/types.ts";
import JsxPluginComponent from "./components/JsxPluginComponent.jsx";

export const jsxPlugin = {
  name: "jsx plugin",
  routes: [
    {
      path: "routeFromJsxPlugin",
      component: JsxPluginComponent,
    },
  ],
  location: import.meta.url,
} satisfies Plugin;
