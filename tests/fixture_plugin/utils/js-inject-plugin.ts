import { Plugin } from "$fresh/server.ts";

export default {
  name: "js-inject",
  entrypoints: {
    "main": new URL("./js-inject-main.ts", import.meta.url).href,
  },
  render(ctx) {
    const res = ctx.render();
    if (res.requiresHydration) {
      return { 
        scripts: [{ 
          entrypoint: "main", 
          state: "JS injected!" + " type:" + typeof(ctx.vnode.type) + " url:" + ctx.context.url 
        }] 
      };
    }
    return {};
  },
} as Plugin;
