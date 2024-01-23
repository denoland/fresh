import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";
import PluginComponent from "./components/PluginComponent.tsx";
import { nestedPlugin } from "./plugins/nestedPlugin.ts";

export default defineConfig({
  plugins: [
    tailwind(),
    {
      name: "dummy plugin",
      routes: [
        {
          path: "routeFromPlugin",
          handler: (_req, ctx) => {
            return ctx.render();
          },
          component: PluginComponent,
        },
      ],
      location: import.meta.url,
    },
    nestedPlugin,
  ],
});
