import { PluginAsync } from "$fresh/server.ts";

export default {
  name: "js-inject",
  entrypoints: {
    "main": new URL("./js-inject-main.ts", import.meta.url).href,
  },
  async render(ctx) {
    const res = await ctx.render();
    if (res.requiresHydration) {
      return { scripts: [{ entrypoint: "main", state: "JS injected!" }] };
    }
    return {};
  },
} as PluginAsync;
