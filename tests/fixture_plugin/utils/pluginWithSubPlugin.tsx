import { Plugin } from "$fresh/server.ts";

export default {
  name: "pluginWithSubPlugin",
  subPlugins: [{
    name: "subPlugin",
    routes: [{
      path: "subPluginRoute",
      component: () => <h1>subPluginRoute</h1>,
    }],
  }],
} satisfies Plugin;
