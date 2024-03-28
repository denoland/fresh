import type { Plugin } from "$fresh/server.ts";

let CSS_TO_INJECT = "h1 { text-decoration: underline; }";

export default {
  name: "css-inject-async",
  async renderAsync(ctx) {
    await new Promise((res) => setTimeout(res, 50));
    const res = await ctx.renderAsync();
    if (res.requiresHydration) {
      CSS_TO_INJECT += " h1 { font-style: italic; }";
    }
    return { styles: [{ cssText: CSS_TO_INJECT, id: "def" }] };
  },
} as Plugin;
