import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";
import PluginComponent from "$fresh/tests/fixture_tailwind/components/PluginComponent.tsx";

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
      location: import.meta.url
    },
  ],
});
