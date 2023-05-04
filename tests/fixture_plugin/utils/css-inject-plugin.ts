import { Plugin } from "$fresh/server.ts";

let CSS_TO_INJECT = "";
export function inject(cssText: string) {
  CSS_TO_INJECT = cssText;
}

export default {
  name: "css-inject",
  async render(ctx) {
    CSS_TO_INJECT = "";
    const res = await ctx.render();
    if (res.requiresHydration) {
      CSS_TO_INJECT += " h1 { color: blue; }";
    }
    return { styles: [{ cssText: CSS_TO_INJECT, id: "abc" }] };
  },
} as Plugin;
