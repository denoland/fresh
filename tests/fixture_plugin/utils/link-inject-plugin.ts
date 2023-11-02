import { Plugin } from "$fresh/server.ts";

export default {
  name: "link-inject",
  render(ctx) {
    ctx.render();
    return {
      cssLinks: [{ url: "styles.css" }, { url: "print.css", media: "print" }],
    };
  },
} as Plugin;
